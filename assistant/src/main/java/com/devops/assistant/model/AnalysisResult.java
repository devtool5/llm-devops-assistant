package com.devops.assistant.model;

import java.util.List;

public class AnalysisResult {

    private String title;
    private String severity;
    private String failedStage;
    private String rootCause;
    private List<String> errorCodes;
    private List<FixStep> fixes;
    private List<String> preventionTips;
    private String estimatedFixTime;

    public static class FixStep {
        private int step;
        private String action;
        private String command;

        public FixStep() {}
        public FixStep(int step, String action, String command) {
            this.step = step;
            this.action = action;
            this.command = command;
        }

        public int getStep() { return step; }
        public void setStep(int step) { this.step = step; }
        public String getAction() { return action; }
        public void setAction(String action) { this.action = action; }
        public String getCommand() { return command; }
        public void setCommand(String command) { this.command = command; }
    }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getSeverity() { return severity; }
    public void setSeverity(String severity) { this.severity = severity; }

    public String getFailedStage() { return failedStage; }
    public void setFailedStage(String failedStage) { this.failedStage = failedStage; }

    public String getRootCause() { return rootCause; }
    public void setRootCause(String rootCause) { this.rootCause = rootCause; }

    public List<String> getErrorCodes() { return errorCodes; }
    public void setErrorCodes(List<String> errorCodes) { this.errorCodes = errorCodes; }

    public List<FixStep> getFixes() { return fixes; }
    public void setFixes(List<FixStep> fixes) { this.fixes = fixes; }

    public List<String> getPreventionTips() { return preventionTips; }
    public void setPreventionTips(List<String> preventionTips) { this.preventionTips = preventionTips; }

    public String getEstimatedFixTime() { return estimatedFixTime; }
    public void setEstimatedFixTime(String estimatedFixTime) { this.estimatedFixTime = estimatedFixTime; }
}