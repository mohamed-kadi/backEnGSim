# Exercises

Use these exercises after reading `docs/LEARNING_PATH.md`. Each exercise is designed to make you practice backend diagnosis, system design reasoning, and senior communication.

## Exercise Format

For each scenario, produce this short incident note:

```text
Impact:

Hypothesis:

Evidence:

Immediate mitigation:

Long-term fix:

Tradeoff:
```

Keep the writing concise. Senior communication is specific, evidence-backed, and honest about uncertainty.

For every exercise, also look at the dashboard system map. Name the component under stress before writing the incident note.

## 1. API Contract Regression

Scenario: `01-dto-regression`

Task:

1. Fetch a user in normal mode.
2. Activate the scenario.
3. Fetch the same user again.
4. Identify the changed response contract.
5. Write an incident note explaining why HTTP 200 can still be a production regression.

Senior vocabulary to use:

- API contract
- backward compatibility
- consumer
- contract test

Review question:

What test would you add so this never ships unnoticed again?

## 2. Latency And Thread Exhaustion

Scenario: `02-api-latency`

Task:

1. Run a normal request and record its response time.
2. Activate the scenario.
3. Run multiple requests or use `load-test.js`.
4. Explain why a 3-second sleep can reduce throughput even though the service is still "up".

Senior vocabulary to use:

- p95 latency
- blocking request thread
- throughput
- bulkhead

Review question:

Would adding more application instances solve the root cause or only increase capacity temporarily?

## 3. Database Boundary Failure

Scenario: `03-db-connection`

Task:

1. Activate the scenario.
2. Call `GET /api/users/{id}`.
3. Locate the exception in logs.
4. Explain why this is an infrastructure-boundary failure rather than a controller bug.

Senior vocabulary to use:

- persistence boundary
- connection pool
- circuit breaker
- readiness check

Review question:

Which endpoints should fail closed, and which could return stale or degraded data?

## 4. Cache Stampede

Scenario: `04-cache-stampede`

Task:

1. Activate the scenario.
2. Trigger a user read.
3. Explain the delay before the 500.
4. Draw the request path if Redis is unavailable and all reads hit PostgreSQL.

Senior vocabulary to use:

- cache miss
- thundering herd
- stale-while-revalidate
- TTL jitter

Review question:

When is serving stale data better than returning an error?

## 5. Write Path And Idempotency

Scenario: `05-write-failure`

Task:

1. POST a user in normal mode.
2. Activate the scenario.
3. POST the same user again.
4. Decide whether the client should retry automatically.

Senior vocabulary to use:

- command path
- idempotency key
- constraint violation
- retry policy

Review question:

How would you prevent duplicate side effects if the client retries after a timeout?

## 6. Memory Leak

Scenario: `06-memory-leak`

Task:

1. Activate the scenario.
2. Send repeated read requests.
3. Watch retained allocation count in logs.
4. Explain why garbage collection cannot reclaim these objects.

Senior vocabulary to use:

- heap
- retained reference
- GC pressure
- heap dump

Review question:

Why is "restart the service" a mitigation but not a fix?

## 7. Kafka Consumer Lag

Scenario: `07-kafka-consumer-lag`

Task:

1. Activate the scenario.
2. Generate several test users from the dashboard.
3. Watch producer and consumer log timing.
4. Explain how the API can be available while the workflow is stale.

Senior vocabulary to use:

- consumer lag
- consumer group
- partition
- eventual consistency

Review question:

When would you scale consumers, and when would you optimize downstream processing first?

## 8. Saga Failure

Scenario: `08-saga-failure`

Task:

1. Activate the scenario.
2. POST a user.
3. Explain the partial commit between user creation and welcome-order creation.
4. Design a compensation strategy in plain English.

Senior vocabulary to use:

- saga
- local transaction
- compensation
- idempotent command

Review question:

What state would you persist so the workflow can resume safely after a crash?

## 9. Rate Limiting

Scenario: `09-rate-limiting`

Task:

1. Activate the scenario.
2. Call any `/api/users` endpoint.
3. Confirm the response is 429, not 500.
4. Write the client behavior you expect after receiving the 429.

Senior vocabulary to use:

- load shedding
- backoff
- retry-after
- capacity protection

Review question:

What dashboard metric would you track separately from 5xx failures?

## DDD Reflection

After completing the runtime exercises, answer these design questions:

1. Is `User` currently an aggregate root or just a persistence entity?
2. What invariant should user registration protect?
3. Should `UserCreated: username` become a domain event like `UserRegistered`?
4. Is `OrderService` a separate bounded context?
5. What coupling exists between user creation and welcome-order creation?

Write the answers before changing code. DDD starts with language and boundaries, not classes.
