package com.backendlab.engine;

import org.apache.kafka.clients.admin.AdminClient;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.connection.RedisConnection;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.client.SimpleClientHttpRequestFactory;

import java.util.List;
import java.util.Map;
import java.util.Properties;
import java.util.concurrent.TimeUnit;

@Service
public class DependencyHealthService {

    private final JdbcTemplate jdbcTemplate;
    private final RedisConnectionFactory redisConnectionFactory;
    private final String kafkaBootstrapServers;
    private final RestTemplate restTemplate;

    public DependencyHealthService(
            JdbcTemplate jdbcTemplate,
            RedisConnectionFactory redisConnectionFactory,
            @Value("${spring.kafka.bootstrap-servers:localhost:9092}") String kafkaBootstrapServers) {
        this.jdbcTemplate = jdbcTemplate;
        this.redisConnectionFactory = redisConnectionFactory;
        this.kafkaBootstrapServers = kafkaBootstrapServers;
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(1500);
        requestFactory.setReadTimeout(1500);
        this.restTemplate = new RestTemplate(requestFactory);
    }

    public List<DependencyStatus> getDependencyStatuses() {
        return List.of(
                new DependencyStatus("api", "Backend API", "Primary Spring Boot service", "UP", "Application context is serving requests"),
                checkPostgres(),
                checkRedis(),
                checkKafka(),
                checkOrderService()
        );
    }

    private DependencyStatus checkPostgres() {
        try {
            Integer result = jdbcTemplate.queryForObject("select 1", Integer.class);
            return new DependencyStatus("postgres", "PostgreSQL", "Primary transactional datastore", "UP", "Query returned " + result);
        } catch (RuntimeException ex) {
            return down("postgres", "PostgreSQL", "Primary transactional datastore", ex);
        }
    }

    private DependencyStatus checkRedis() {
        try (RedisConnection connection = redisConnectionFactory.getConnection()) {
            String pong = connection.ping();
            return new DependencyStatus("redis", "Redis", "Cache and fast lookup boundary", "UP", pong != null ? pong : "PING completed");
        } catch (RuntimeException ex) {
            return down("redis", "Redis", "Cache and fast lookup boundary", ex);
        }
    }

    private DependencyStatus checkKafka() {
        Properties properties = new Properties();
        properties.put("bootstrap.servers", kafkaBootstrapServers);
        properties.put("request.timeout.ms", "1500");
        properties.put("default.api.timeout.ms", "1500");

        try (AdminClient adminClient = AdminClient.create(properties)) {
            int nodeCount = adminClient.describeCluster().nodes().get(1500, TimeUnit.MILLISECONDS).size();
            return new DependencyStatus("kafka", "Kafka", "Asynchronous event backbone", "UP", "Cluster reachable with " + nodeCount + " broker node(s)");
        } catch (Exception ex) {
            return down("kafka", "Kafka", "Asynchronous event backbone", ex);
        }
    }

    private DependencyStatus checkOrderService() {
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> response = restTemplate.getForObject("http://localhost:8081/actuator/health", Map.class);
            Object status = response != null ? response.get("status") : "UNKNOWN";
            boolean up = "UP".equals(status);
            return new DependencyStatus("order", "Order Service", "Secondary service and saga boundary", up ? "UP" : "DEGRADED", "Actuator status " + status);
        } catch (RestClientException ex) {
            return down("order", "Order Service", "Secondary service and saga boundary", ex);
        }
    }

    private DependencyStatus down(String id, String name, String role, Exception ex) {
        return new DependencyStatus(id, name, role, "DOWN", concise(ex));
    }

    private String concise(Exception ex) {
        String message = ex.getMessage();
        if (message == null || message.isBlank()) {
            return ex.getClass().getSimpleName();
        }
        return message.length() > 180 ? message.substring(0, 177) + "..." : message;
    }
}
