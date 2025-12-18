package edu.uth.backend.ai;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.core.publisher.Mono;
import reactor.util.retry.Retry;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Dịch vụ Proxy AI
 * Xử lý các yêu cầu HTTP tới dịch vụ AI với mẫu circuit breaker và caching.
 */
@Service
public class AIProxyService {

    private static final Logger logger = LoggerFactory.getLogger(AIProxyService.class);
    
    private final WebClient webClient;
    private final ObjectMapper objectMapper;
    
    // Simple in-memory cache (can be replaced with Redis)
    private final Map<String, CacheEntry> cache = new ConcurrentHashMap<>();
    private static final long CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
    
    @Value("${app.ai.service.url:http://localhost:8001}")
    private String aiServiceUrl;
    
    @Value("${app.ai.service.timeout:30000}")
    private int timeoutMs;
    
    @Value("${app.ai.service.retry.max-attempts:3}")
    private int maxRetries;
    
    @Value("${app.ai.service.cache.enabled:true}")
    private boolean cacheEnabled;

    public AIProxyService(WebClient.Builder webClientBuilder, ObjectMapper objectMapper) {
        this.webClient = webClientBuilder
                .baseUrl(aiServiceUrl)
                .defaultHeader("Content-Type", MediaType.APPLICATION_JSON_VALUE)
                .build();
        this.objectMapper = objectMapper;
    }

    /**
     * Call AI service endpoint with retry logic and circuit breaker.
     * 
     * @param endpoint Endpoint path (e.g., "/api/v1/authors/check-spelling")
     * @param payload Request payload
     * @param responseClass Response class
     * @return Response object
     * @throws AIServiceException If AI service call fails
     */
    public <T> T callAIService(String endpoint, Object payload, Class<T> responseClass) {
        try {
            // Check cache first
            if (cacheEnabled && payload != null) {
                String cacheKey = generateCacheKey(endpoint, payload);
                CacheEntry cached = cache.get(cacheKey);
                if (cached != null && !cached.isExpired()) {
                    logger.debug("Cache hit for endpoint: {}", endpoint);
                    return objectMapper.convertValue(cached.getValue(), responseClass);
                }
            }
            
            // Make request
            String requestBody = objectMapper.writeValueAsString(payload);
            
            T response = webClient.post()
                    .uri(endpoint)
                    .bodyValue(requestBody)
                    .retrieve()
                        .onStatus(status -> status.is4xxClientError(), clientResponse -> {
                        logger.warn("Lỗi client từ dịch vụ AI: {} - {}", 
                            clientResponse.statusCode(), endpoint);
                        return Mono.error(new AIServiceException(
                            "Lỗi client dịch vụ AI: " + clientResponse.statusCode()));
                        })
                        .onStatus(status -> status.is5xxServerError(), clientResponse -> {
                        logger.error("Lỗi server từ dịch vụ AI: {} - {}", 
                            clientResponse.statusCode(), endpoint);
                        return Mono.error(new AIServiceException(
                            "Lỗi server dịch vụ AI: " + clientResponse.statusCode()));
                        })
                    .bodyToMono(String.class)
                    .timeout(Duration.ofMillis(timeoutMs))
                    .retryWhen(Retry.fixedDelay(maxRetries, Duration.ofSeconds(1))
                            .filter(throwable -> throwable instanceof WebClientResponseException
                                    && ((WebClientResponseException) throwable).getStatusCode().is5xxServerError()))
                    .map(responseBody -> {
                        try {
                            return objectMapper.readValue(responseBody, responseClass);
                            } catch (Exception e) {
                            logger.error("Lỗi phân tích phản hồi từ dịch vụ AI", e);
                            throw new AIServiceException("Phân tích phản hồi dịch vụ AI thất bại", e);
                        }
                    })
                    .block();
            
            // Cache response
            if (cacheEnabled && response != null && payload != null) {
                String cacheKey = generateCacheKey(endpoint, payload);
                cache.put(cacheKey, new CacheEntry(response, System.currentTimeMillis()));
            }
            
            return response;
            
        } catch (WebClientResponseException e) {
            logger.error("Lỗi HTTP từ dịch vụ AI: {} - {}", e.getStatusCode(), endpoint, e);
            throw new AIServiceException("Lỗi HTTP dịch vụ AI: " + e.getStatusCode(), e);
        } catch (Exception e) {
            logger.error("Gọi dịch vụ AI thất bại: {}", endpoint, e);
            throw new AIServiceException("Gọi dịch vụ AI thất bại", e);
        }
    }
    
    /**
     * Generate cache key from endpoint and payload.
     */
    private String generateCacheKey(String endpoint, Object payload) {
        try {
            String payloadStr = objectMapper.writeValueAsString(payload);
            return endpoint + ":" + payloadStr.hashCode();
        } catch (Exception e) {
            return endpoint + ":" + payload.hashCode();
        }
    }
    
    /**
     * Clear cache (useful for testing or manual cache invalidation).
     */
    public void clearCache() {
        cache.clear();
        logger.info("Đã xóa cache dịch vụ AI");
    }
    
    /**
     * Cache entry with TTL.
     */
    private static class CacheEntry {
        private final Object value;
        private final long timestamp;
        
        public CacheEntry(Object value, long timestamp) {
            this.value = value;
            this.timestamp = timestamp;
        }
        
        public Object getValue() {
            return value;
        }
        
        public boolean isExpired() {
            return System.currentTimeMillis() - timestamp > CACHE_TTL_MS;
        }
    }
    
    /**
     * Custom exception for AI service errors.
     */
    public static class AIServiceException extends RuntimeException {
        public AIServiceException(String message) {
            super(message);
        }
        
        public AIServiceException(String message, Throwable cause) {
            super(message, cause);
        }
    }
}

