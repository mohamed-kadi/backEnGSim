# Scenario Catalog

The backend exposes this same catalog at:

```text
GET /api/_system/scenario/catalog
```

Use the catalog as a learning guide. Each scenario maps one injected failure to a backend/system-design concept.

## `01-dto-regression`

Category: API Contracts

Trigger: `GET /api/users/{id}`

Failure: the response removes the `email` field.

Learn:

- JSON payloads are contracts.
- Contract tests catch semantic regressions before deployment.
- HTTP 200 does not mean clients are safe.

Senior diagnosis:

This is a consumer contract breach. The producer returned a successful status but violated a required response shape.

## `02-api-latency`

Category: Performance

Trigger: any `/api/users` request

Failure: each request sleeps for 3 seconds.

Learn:

- Blocking request threads reduce throughput.
- P95 and P99 latency reveal user pain.
- Slow dependencies can exhaust worker pools.

Senior diagnosis:

This is tail-latency amplification in a synchronous service.

## `03-db-connection`

Category: Persistence

Trigger: any `UserRepository` access

Failure: repository calls throw `DataAccessResourceFailureException`.

Learn:

- Databases are infrastructure dependencies.
- Connection pool failures should not be treated as generic mystery 500s.
- Circuit breakers and readiness checks protect the system.

Senior diagnosis:

The persistence boundary is unavailable and the application has no graceful degradation path.

## `04-cache-stampede`

Category: Caching

Trigger: any `/api/users` request

Failure: request waits 5 seconds and then fails.

Learn:

- Cache failures can overload the database.
- TTL jitter and request coalescing reduce herd behavior.
- Serving stale data can be safer than failing every request.

Senior diagnosis:

The cache layer stopped absorbing read traffic, causing a thundering herd against slower backing systems.

## `05-write-failure`

Category: Persistence

Trigger: `POST /api/users`

Failure: writes throw `DataIntegrityViolationException`.

Learn:

- Write paths need clearer error semantics than generic 500.
- Idempotency matters when clients retry commands.
- Constraints and lock contention are business and infrastructure problems.

Senior diagnosis:

The command side is failing at the persistence boundary. Retry behavior must be bounded and idempotent.

## `06-memory-leak`

Category: Runtime

Trigger: any `/api/users` request

Failure: the service retains 10MB per request.

Learn:

- Memory leaks are retained references, not just high allocation.
- GC pressure usually appears before total crash.
- Heap dumps are evidence, not guesswork.

Senior diagnosis:

The service has unbounded heap retention in the request path.

## `07-kafka-consumer-lag`

Category: Event-Driven Architecture

Trigger: `POST /api/users`

Failure: Kafka consumer sleeps for 5 seconds per message.

Learn:

- Async workflows can be available but stale.
- Consumer lag measures freshness.
- Partition count and consumer concurrency shape throughput.

Senior diagnosis:

The producer is accepting writes faster than the consumer group can process downstream work.

## `08-saga-failure`

Category: Distributed Systems

Trigger: `POST /api/users`

Failure: user save succeeds but the order-service call fails.

Learn:

- Local database commits do not make distributed workflows atomic.
- Sagas need explicit states and compensating actions.
- Cross-service calls require idempotency and timeout policy.

Senior diagnosis:

This is a partial commit across service boundaries.

## `09-rate-limiting`

Category: Traffic Management

Trigger: any `/api/users` request

Failure: API returns HTTP 429.

Learn:

- Rate limiting protects capacity.
- 429 is different from 500.
- Clients should use backoff instead of tight retry loops.

Senior diagnosis:

The service is shedding load intentionally to protect availability.

## `10-openapi-contract-drift`

Category: API Contracts

Trigger: `GET /api/users/{id}`

Failure: the response returns `contactEmail` instead of the documented `email` field.

Learn:

- OpenAPI is an executable contract when clients are generated from it.
- Renaming a response field is backward-incompatible unless the old field is preserved during migration.
- Contract diff checks should run before deployment, not after consumers break.

Senior diagnosis:

This is a schema evolution failure. The endpoint returns HTTP 200, but generated clients and runtime behavior disagree.
