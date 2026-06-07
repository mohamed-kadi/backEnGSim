package com.backendlab.engine;

import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class ScenarioCatalog {

    private final List<ScenarioDefinition> scenarios = List.of(
            new ScenarioDefinition(
                    "01-dto-regression",
                    "DTO Contract Regression",
                    "API Contracts",
                    "Beginner",
                    "GET /api/users/{id}",
                    "The response intentionally removes the email field from an otherwise valid User payload.",
                    "Learn why JSON shape is a contract and why backward-incompatible response changes break downstream consumers.",
                    "This is a consumer contract breach. The service still returns HTTP 200, but the semantic payload contract changed, so downstream clients fail outside the producer's immediate error budget.",
                    "Restore the removed field, add contract tests for required response properties, and gate deployments on schema compatibility.",
                    List.of("client", "aop"),
                    List.of("DTO", "API contract", "backward compatibility", "consumer-driven testing"),
                    List.of(
                            "Call GET /api/users/{id} in normal mode and record the response shape.",
                            "Activate the scenario and repeat the request.",
                            "Compare payloads and identify which consumer assumption was violated.",
                            "Run the contract test suite and connect the failure to CI deployment safety."
                    )
            ),
            new ScenarioDefinition(
                    "02-api-latency",
                    "API Latency Degradation",
                    "Performance",
                    "Beginner",
                    "Any /api/users request",
                    "The request thread sleeps for 3 seconds before continuing.",
                    "Learn how synchronous request handling, thread pools, and latency percentiles interact under load.",
                    "This is tail-latency amplification in a blocking thread-per-request service. P95/P99 latency rises first, then throughput collapses when worker threads are occupied by slow requests.",
                    "Add timeouts, bulkheads, load shedding, and dashboards for p95/p99 latency. Move slow downstream work out of the request path when possible.",
                    List.of("aop", "api"),
                    List.of("p95 latency", "thread exhaustion", "blocking IO", "bulkhead"),
                    List.of(
                            "Trigger a normal request and observe baseline latency.",
                            "Activate the scenario and repeat the request.",
                            "Run k6 and watch request duration thresholds fail.",
                            "Explain why average latency can hide user-visible pain."
                    )
            ),
            new ScenarioDefinition(
                    "03-db-connection",
                    "Database Connection Failure",
                    "Persistence",
                    "Intermediate",
                    "Any UserRepository call",
                    "Repository access throws DataAccessResourceFailureException before touching PostgreSQL.",
                    "Learn how a primary datastore outage appears at the API layer and why repositories are infrastructure boundaries.",
                    "The application has no graceful degradation path for the persistence boundary. A data access resource failure bubbles into HTTP 500, so every read/write path coupled to PostgreSQL fails closed.",
                    "Add circuit breakers, readiness checks, retry policy for transient errors, and explicit error mapping. Separate critical and non-critical data paths.",
                    List.of("postgres"),
                    List.of("connection pool", "circuit breaker", "readiness probe", "infrastructure boundary"),
                    List.of(
                            "Activate the scenario and request a user.",
                            "Inspect logs for DataAccessResourceFailureException.",
                            "Explain whether retrying immediately helps or worsens the outage.",
                            "Identify which endpoints are coupled to the database."
                    )
            ),
            new ScenarioDefinition(
                    "04-cache-stampede",
                    "Cache Stampede",
                    "Caching",
                    "Intermediate",
                    "Any /api/users request",
                    "The request waits 5 seconds and then fails, simulating cache collapse and backend overload.",
                    "Learn how cache failures can transfer traffic to slower systems and create cascading failure.",
                    "This is a thundering herd failure. The cache layer stops absorbing read traffic, concurrent misses converge on the database, and latency turns into saturation.",
                    "Use request coalescing, stale-while-revalidate, per-key locks, jittered TTLs, and cache failure fallback behavior.",
                    List.of("redis", "postgres"),
                    List.of("cache miss", "thundering herd", "TTL jitter", "stale reads"),
                    List.of(
                            "Generate normal read traffic.",
                            "Activate the scenario and observe delayed 500 responses.",
                            "Explain why the database becomes the next bottleneck.",
                            "Design a stale-data fallback that protects the write path."
                    )
            ),
            new ScenarioDefinition(
                    "05-write-failure",
                    "Write Path Failure",
                    "Persistence",
                    "Intermediate",
                    "POST /api/users",
                    "Create-user requests throw DataIntegrityViolationException.",
                    "Learn how constraint violations, locks, and write contention should be handled differently from generic server errors.",
                    "The command side of the system is failing at the persistence boundary. This is a write-path availability issue, not a read-model issue, so retries must be bounded and idempotency matters.",
                    "Validate inputs, map constraint failures to 409/422 where appropriate, use idempotency keys for retried commands, and monitor deadlocks/lock waits.",
                    List.of("postgres"),
                    List.of("command path", "constraint", "idempotency", "deadlock"),
                    List.of(
                            "POST a user in normal mode.",
                            "Activate the scenario and POST again.",
                            "Classify whether the error should be retryable.",
                            "Explain how idempotency prevents duplicate side effects."
                    )
            ),
            new ScenarioDefinition(
                    "06-memory-leak",
                    "JVM Memory Leak",
                    "Runtime",
                    "Advanced",
                    "Any /api/users request",
                    "Each request retains another 10MB allocation in memory.",
                    "Learn how heap growth, garbage collection pressure, and eventual OutOfMemoryError develop over time.",
                    "The service has unbounded heap retention. GC can reclaim unreachable objects, but retained references accumulate until GC overhead rises and the process loses availability.",
                    "Capture heap dumps, inspect dominant retainers, set memory alerts, and remove unbounded in-memory collections from request paths.",
                    List.of("api"),
                    List.of("heap", "GC pressure", "retained object", "OOM"),
                    List.of(
                            "Activate the scenario.",
                            "Send repeated GET requests.",
                            "Watch logs count retained allocations.",
                            "Explain why restarting fixes symptoms but not root cause."
                    )
            ),
            new ScenarioDefinition(
                    "07-kafka-consumer-lag",
                    "Kafka Consumer Lag",
                    "Event-Driven Architecture",
                    "Intermediate",
                    "POST /api/users",
                    "The user-events consumer sleeps for 5 seconds per message.",
                    "Learn why asynchronous systems can be healthy at the producer while still failing downstream freshness guarantees.",
                    "The producer accepts writes, but the consumer group cannot keep up with topic ingress. The system is available but stale, which is an eventual-consistency SLO failure.",
                    "Scale consumers to partition count, reduce downstream latency, monitor consumer lag, and define freshness SLOs for async workflows.",
                    List.of("kafka"),
                    List.of("consumer group", "lag", "partition", "eventual consistency"),
                    List.of(
                            "Activate the scenario.",
                            "Generate several test users.",
                            "Read logs to compare produce time and consume completion time.",
                            "Explain the difference between accepted writes and completed workflows."
                    )
            ),
            new ScenarioDefinition(
                    "08-saga-failure",
                    "Saga Boundary Failure",
                    "Distributed Systems",
                    "Advanced",
                    "POST /api/users",
                    "The backend saves the user, then the cross-service order call fails.",
                    "Learn why distributed transactions need compensating actions and why local commits are not enough.",
                    "This is a partial commit across service boundaries. The user service committed its local transaction, but the order workflow failed, leaving business state inconsistent.",
                    "Model the workflow as a saga with explicit states, retries, compensation, and idempotent downstream commands.",
                    List.of("api", "order"),
                    List.of("saga", "compensation", "partial commit", "distributed transaction"),
                    List.of(
                            "Activate the scenario.",
                            "POST a user.",
                            "Verify that user creation can succeed while order creation fails.",
                            "Sketch the compensating transaction or workflow state machine."
                    )
            ),
            new ScenarioDefinition(
                    "09-rate-limiting",
                    "Rate Limiting",
                    "Traffic Management",
                    "Beginner",
                    "Any /api/users request",
                    "The API rejects requests with HTTP 429 Too Many Requests.",
                    "Learn how systems protect themselves from overload and how clients should behave under throttling.",
                    "The service is intentionally shedding load. This is a capacity-protection mechanism, not a server crash, so clients need backoff and product flows need graceful degradation.",
                    "Return clear 429 responses, include retry guidance, implement exponential backoff, and monitor rejected traffic separately from 5xx failures.",
                    List.of("api"),
                    List.of("rate limit", "load shedding", "backoff", "429"),
                    List.of(
                            "Activate the scenario.",
                            "Call any user endpoint.",
                            "Confirm the status code is 429 rather than 500.",
                            "Design the client retry behavior."
                    )
            )
    );

    public List<ScenarioDefinition> findAll() {
        return scenarios;
    }

    public Optional<ScenarioDefinition> findById(String id) {
        return scenarios.stream()
                .filter(scenario -> scenario.id().equals(id))
                .findFirst();
    }

    public boolean exists(String id) {
        return findById(id).isPresent();
    }
}
