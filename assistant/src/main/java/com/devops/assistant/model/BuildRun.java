package com.devops.assistant.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "build_runs")
public class BuildRun {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String jobName;
    private Integer buildNumber;
    private String status;
    private String failedStage;
    private String severity;

    @Column(columnDefinition = "TEXT")
    private String rawLog;

    @Column(columnDefinition = "TEXT")
    private String failureSummary;

    @Column(columnDefinition = "TEXT")
    private String rootCause;

    @Column(columnDefinition = "TEXT")
    private String fixSuggestions;

    private Long duration;
    private LocalDateTime triggeredAt;
    private LocalDateTime analyzedAt;

    public BuildRun() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getJobName() { return jobName; }
    public void setJobName(String jobName) { this.jobName = jobName; }

    public Integer getBuildNumber() { return buildNumber; }
    public void setBuildNumber(Integer buildNumber) { this.buildNumber = buildNumber; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getFailedStage() { return failedStage; }
    public void setFailedStage(String failedStage) { this.failedStage = failedStage; }

    public String getSeverity() { return severity; }
    public void setSeverity(String severity) { this.severity = severity; }

    public String getRawLog() { return rawLog; }
    public void setRawLog(String rawLog) { this.rawLog = rawLog; }

    public String getFailureSummary() { return failureSummary; }
    public void setFailureSummary(String failureSummary) { this.failureSummary = failureSummary; }

    public String getRootCause() { return rootCause; }
    public void setRootCause(String rootCause) { this.rootCause = rootCause; }

    public String getFixSuggestions() { return fixSuggestions; }
    public void setFixSuggestions(String fixSuggestions) { this.fixSuggestions = fixSuggestions; }

    public Long getDuration() { return duration; }
    public void setDuration(Long duration) { this.duration = duration; }

    public LocalDateTime getTriggeredAt() { return triggeredAt; }
    public void setTriggeredAt(LocalDateTime triggeredAt) { this.triggeredAt = triggeredAt; }

    public LocalDateTime getAnalyzedAt() { return analyzedAt; }
    public void setAnalyzedAt(LocalDateTime analyzedAt) { this.analyzedAt = analyzedAt; }
}