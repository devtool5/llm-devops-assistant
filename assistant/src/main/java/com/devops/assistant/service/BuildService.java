package com.devops.assistant.service;

import com.devops.assistant.model.AnalysisResult;
import com.devops.assistant.model.BuildRun;
import com.devops.assistant.repository.BuildRunRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
public class BuildService {

    private static final Logger log = LoggerFactory.getLogger(BuildService.class);

    private final JenkinsService jenkinsService;
    private final LLMService llmService;
    private final BuildRunRepository repository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public BuildService(JenkinsService jenkinsService,
                        LLMService llmService,
                        BuildRunRepository repository) {
        this.jenkinsService = jenkinsService;
        this.llmService = llmService;
        this.repository = repository;
    }

    public AnalysisResult analyzeJenkinsBuild(String jobName, int buildNumber) {
        log.info("Starting analysis for {}/{}", jobName, buildNumber);
        Map<String, Object> metadata = jenkinsService.fetchBuildMetadata(jobName, buildNumber);
        String consoleLog = jenkinsService.fetchConsoleLog(jobName, buildNumber);
        String jenkinsStatus = (String) metadata.getOrDefault("result", "UNKNOWN");
        Long duration = metadata.get("duration") != null
                ? Long.parseLong(metadata.get("duration").toString()) : 0L;
        AnalysisResult result = llmService.analyze(consoleLog);
        BuildRun run = new BuildRun();
        run.setJobName(jobName);
        run.setBuildNumber(buildNumber);
        run.setStatus(jenkinsStatus);
        run.setFailedStage(result.getFailedStage());
        run.setSeverity(result.getSeverity());
        run.setRawLog(consoleLog);
        run.setFailureSummary(result.getTitle());
        run.setRootCause(result.getRootCause());
        run.setDuration(duration);
        run.setTriggeredAt(LocalDateTime.now());
        run.setAnalyzedAt(LocalDateTime.now());
        try {
            run.setFixSuggestions(objectMapper.writeValueAsString(result.getFixes()));
        } catch (Exception e) {
            log.warn("Could not serialize fix suggestions: {}", e.getMessage());
        }
        repository.save(run);
        return result;
    }

    public AnalysisResult analyzeRawLog(String jobName, String rawLog) {
        log.info("Analyzing raw log for job '{}'", jobName);
        AnalysisResult result = llmService.analyze(rawLog);
        BuildRun run = new BuildRun();
        run.setJobName(jobName != null ? jobName : "manual-paste");
        run.setBuildNumber(0);
        run.setStatus("FAILURE");
        run.setFailedStage(result.getFailedStage());
        run.setSeverity(result.getSeverity());
        run.setRawLog(rawLog);
        run.setFailureSummary(result.getTitle());
        run.setRootCause(result.getRootCause());
        run.setTriggeredAt(LocalDateTime.now());
        run.setAnalyzedAt(LocalDateTime.now());
        repository.save(run);
        return result;
    }

    public List<BuildRun> getRecentRuns() {
        return repository.findTop100ByOrderByTriggeredAtDesc(PageRequest.of(0, 100));
    }

    public List<BuildRun> getRunsByJob(String jobName) {
        return repository.findByJobNameOrderByTriggeredAtDesc(jobName);
    }

    public Map<String, Long> getStats() {
        long total = repository.count();
        long failed = repository.findByStatusOrderByTriggeredAtDesc("FAILURE").size();
        long critical = repository.countBySeverity("CRITICAL");
        long high = repository.countBySeverity("HIGH");
        return Map.of("total", total, "failed", failed, "critical", critical, "high", high);
    }
}