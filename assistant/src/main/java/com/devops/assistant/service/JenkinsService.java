package com.devops.assistant.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.List;
import java.util.Map;

@Service
public class JenkinsService {

    private static final Logger log = LoggerFactory.getLogger(JenkinsService.class);

    @Value("${jenkins.base-url}")
    private String jenkinsBaseUrl;

    @Value("${jenkins.username}")
    private String jenkinsUsername;

    @Value("${jenkins.api-token}")
    private String jenkinsApiToken;

    private final RestTemplate restTemplate = new RestTemplate();

    private HttpHeaders authHeaders() {
        String credentials = jenkinsUsername + ":" + jenkinsApiToken;
        String encoded = Base64.getEncoder()
                .encodeToString(credentials.getBytes(StandardCharsets.UTF_8));
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Basic " + encoded);
        return headers;
    }

    @SuppressWarnings("unchecked")
    public List<Integer> getBuildNumbers(String jobName) {
        String url = jenkinsBaseUrl + "/job/" + jobName + "/api/json?tree=builds[number]";
        HttpEntity<Void> entity = new HttpEntity<>(authHeaders());
        try {
            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.GET, entity, Map.class);
            List<Map<String, Integer>> builds = (List<Map<String, Integer>>) response.getBody().get("builds");
            return builds.stream().map(b -> b.get("number")).toList();
        } catch (Exception e) {
            log.error("Failed to fetch build list for job '{}': {}", jobName, e.getMessage());
            throw new RuntimeException("Could not connect to Jenkins. Check base-url / credentials.");
        }
    }

    public String fetchConsoleLog(String jobName, int buildNumber) {
        String url = jenkinsBaseUrl + "/job/" + jobName + "/" + buildNumber + "/consoleText";
        HttpEntity<Void> entity = new HttpEntity<>(authHeaders());
        try {
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.GET, entity, String.class);
            log.info("Fetched console log for {}/{}", jobName, buildNumber);
            return response.getBody();
        } catch (Exception e) {
            log.error("Failed to fetch console log for {}/{}: {}", jobName, buildNumber, e.getMessage());
            throw new RuntimeException("Could not fetch Jenkins console log: " + e.getMessage());
        }
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> fetchBuildMetadata(String jobName, int buildNumber) {
        String url = jenkinsBaseUrl + "/job/" + jobName + "/" + buildNumber
                + "/api/json?tree=result,duration,timestamp,displayName";
        HttpEntity<Void> entity = new HttpEntity<>(authHeaders());
        try {
            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.GET, entity, Map.class);
            return response.getBody();
        } catch (Exception e) {
            log.error("Failed to fetch metadata for {}/{}: {}", jobName, buildNumber, e.getMessage());
            throw new RuntimeException("Could not fetch Jenkins build metadata: " + e.getMessage());
        }
    }
}