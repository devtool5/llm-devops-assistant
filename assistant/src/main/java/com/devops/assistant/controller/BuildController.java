package com.devops.assistant.controller;

import com.devops.assistant.model.AnalysisResult;
import com.devops.assistant.model.BuildRun;
import com.devops.assistant.service.BuildService;
import com.devops.assistant.service.JenkinsService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/builds")
@CrossOrigin(origins = "*")
public class BuildController {

    private final BuildService buildService;
    private final JenkinsService jenkinsService;

    public BuildController(BuildService buildService, JenkinsService jenkinsService) {
        this.buildService = buildService;
        this.jenkinsService = jenkinsService;
    }

    @PostMapping("/analyze/jenkins")
    public ResponseEntity<AnalysisResult> analyzeFromJenkins(@RequestBody Map<String, Object> payload) {
        String jobName = (String) payload.get("jobName");
        int buildNumber = (Integer) payload.get("buildNumber");
        AnalysisResult result = buildService.analyzeJenkinsBuild(jobName, buildNumber);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/analyze/raw")
    public ResponseEntity<AnalysisResult> analyzeRaw(@RequestBody Map<String, String> payload) {
        String jobName = payload.getOrDefault("jobName", "manual-paste");
        String rawLog = payload.get("log");
        AnalysisResult result = buildService.analyzeRawLog(jobName, rawLog);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/history")
    public ResponseEntity<List<BuildRun>> getHistory() {
        return ResponseEntity.ok(buildService.getRecentRuns());
    }

    @GetMapping("/history/{jobName}")
    public ResponseEntity<List<BuildRun>> getByJob(@PathVariable String jobName) {
        return ResponseEntity.ok(buildService.getRunsByJob(jobName));
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Long>> getStats() {
        return ResponseEntity.ok(buildService.getStats());
    }

    @GetMapping("/jenkins/jobs/{jobName}/builds")
    public ResponseEntity<List<Integer>> getJenkinsBuildNumbers(@PathVariable String jobName) {
        return ResponseEntity.ok(jenkinsService.getBuildNumbers(jobName));
    }
}