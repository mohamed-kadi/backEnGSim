# Learning Path

This platform is designed to teach backend systems progressively. Do not start by memorizing every tool. Start by learning how to ask better engineering questions.

## Stage 1: API And Runtime Basics

Focus scenarios:

- `01-dto-regression`
- `02-api-latency`
- `09-rate-limiting`

What to learn:

- HTTP status codes are not the whole contract.
- JSON response shape is part of the public API.
- Latency percentiles matter more than averages.
- Rate limiting is controlled load shedding, not a crash.

Practice output:

- Explain the difference between a 500, a 429, and a 200 response with a broken payload.
- Write a short incident update using the words "contract", "latency", "throughput", and "backoff".

## Stage 2: Persistence And Caching

Focus scenarios:

- `03-db-connection`
- `04-cache-stampede`
- `05-write-failure`

What to learn:

- Repositories are infrastructure boundaries.
- Caches protect databases but can also cause cascading failures.
- Write failures need idempotency and careful retry behavior.

Practice output:

- Draw the request path from controller to repository to PostgreSQL.
- Explain why a cache outage can become a database outage.
- Decide whether each failure is retryable, non-retryable, or retryable only with backoff.

## Stage 3: Event-Driven And Distributed Systems

Focus scenarios:

- `07-kafka-consumer-lag`
- `08-saga-failure`

What to learn:

- Asynchronous workflows can accept writes while still falling behind.
- Consumer lag is a freshness problem.
- A local database transaction does not make a distributed workflow atomic.
- Sagas need explicit state, retries, compensation, and idempotency.

Practice output:

- Explain the difference between "user was saved" and "user onboarding workflow completed".
- Sketch a saga state machine for user creation and welcome-order creation.

## Stage 4: DDD Thinking

Current code intentionally starts simple. Use it to ask DDD questions:

- Is `User` an entity, aggregate root, or just an anemic persistence model?
- Which business invariant should the `User` aggregate protect?
- Does `OrderService` represent a separate bounded context?
- Should user creation publish a domain event like `UserRegistered` instead of a string message?

Practice output:

- Define a `UserRegistered` domain event in plain English.
- Identify which data belongs to the User context and which belongs to the Order context.
- Explain why direct cross-service writes are dangerous.

## Stage 5: Senior Communication

For every scenario, practice this format:

```text
Impact:
Users experience ...

Current hypothesis:
The failure appears to be at the ... boundary because ...

Evidence:
Logs show ...
Metrics show ...
HTTP behavior shows ...

Mitigation:
Short term ...

Long term:
Prevent recurrence by ...
```

The skill is not only fixing code. The skill is communicating tradeoffs clearly while the system is failing.
