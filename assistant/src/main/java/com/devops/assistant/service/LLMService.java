package com.devops.assistant.service;

import com.devops.assistant.model.AnalysisResult;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import java.util.List;
import java.util.Map;

@Service
public class LLMService {

    private static final Logger log = LoggerFactory.getLogger(LLMService.class);

    @Value("${groq.api-key}")
    private String groqApiKey;

    private static final String GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
    private static final String MODEL = "llama-3.3-70b-versatile";

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    private static final String SYSTEM_PROMPT = """
            You are an expert DevOps engineer and CI/CD pipeline specialist with deep knowledge of
            Jenkins, Maven, Docker, Kubernetes, and common build/test frameworks.
            
            Your task is to analyze build logs and return ONLY a valid JSON object — no markdown,
            no explanation, no code fences. Use this exact schema:
            
            {
              "title": "Brief failure title (max 8 words)",
              "severity": "CRITICAL|HIGH|MEDIUM|LOW",
              "failedStage": "Checkout|Build|Test|Package|Push|Deploy",
              "rootCause": "1-2 sentence plain-English root cause",
              "errorCodes": ["ERR_CODE_1", "ERR_CODE_2"],
              "fixes": [
                { "step": 1, "action": "What to do", "command": "exact terminal command or empty string" },
                { "step": 2, "action": "Second fix", "command": "" }
              ],
              "preventionTips": ["Tip 1", "Tip 2"],
              "estimatedFixTime": "e.g. 10 minutes"
            }
            
            Severity guide:
            - CRITICAL: build completely broken, blocks all deployments
            - HIGH: major feature broken or test suite >30% failing
            - MEDIUM: non-blocking issue, workaround exists
            - LOW: warning or style issue, no functional impact
            """;

    private String buildUserPrompt(String consoleLog) {
        String trimmedLog = consoleLog.length() > 8000
                ? consoleLog.substring(0, 4000) + "\n...[truncated]...\n"
                + consoleLog.substring(consoleLog.length() - 4000)
                : consoleLog;
        return "Analyze this Jenkins build log and return the JSON analysis:\n\n" + trimmedLog;
    }

    public AnalysisResult analyze(String consoleLog) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(groqApiKey);

        Map<String, Object> body = Map.of(
                "model", MODEL,
                "temperature", 0.2,
                "messages", List.of(
                        Map.of("role", "system", "content", SYSTEM_PROMPT),
                        Map.of("role", "user", "content", buildUserPrompt(consoleLog))
                )
        );

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(GROQ_URL, request, Map.class);
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> choices = (List<Map<String, Object>>) response.getBody().get("choices");
            Map<String, Object> message = (Map<String, Object>) choices.get(0).get("message");
            String jsonContent = (String) message.get("content");

            // Clean any markdown fences just in case
            jsonContent = jsonContent.replace("```json", "").replace("```", "").trim();

            log.info("LLM analysis complete. Response length: {}", jsonContent.length());
            return objectMapper.readValue(jsonContent, AnalysisResult.class);
        } catch (Exception e) {
            log.error("LLM analysis failed: {}", e.getMessage());
            throw new RuntimeException("LLM analysis error: " + e.getMessage());
        }
    }
}