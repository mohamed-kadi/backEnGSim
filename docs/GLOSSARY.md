# Glossary

## API Contract

The promise an API makes to its consumers. It includes endpoint paths, methods, status codes, required fields, optional fields, types, and semantics. A response can return HTTP 200 and still break the contract if required data disappears.

## Backward Compatibility

A change is backward compatible when existing clients continue working without modification. Removing a response field is usually not backward compatible.

## Bounded Context

A DDD boundary where a model has a specific meaning. `User` in an identity context may mean credentials and profile information. `Customer` in an ordering context may mean billing and shipping identity. Mixing those models creates coupling.

## Aggregate Root

The entity that protects a group of related business rules. Other objects inside the aggregate should be changed through the root so invariants stay valid.

## Entity

An object with a stable identity over time. Its fields can change, but it remains the same conceptual thing. A `User` can change email while still being the same user.

## Value Object

An immutable object defined by its values instead of an identity. `EmailAddress`, `Money`, and `PaymentAmount` are good candidates because validation and equality depend on the contained values.

## Invariant

A business rule that must always remain true after a command completes. Example: a payment capture cannot exceed the authorized amount.

## Domain Event

A fact that happened in the business domain, named in business language. Example: `UserRegistered`. It is stronger than a technical message like `UserCreated: bob`.

## Repository

A collection-like abstraction for loading and saving aggregates. A repository should not become a dumping ground for business rules.

## Anti-Corruption Layer

A translation boundary that prevents another system's model from leaking into your domain model. Payment provider responses should be translated into internal payment language before the rest of the system sees them.

## Circuit Breaker

A resilience pattern that stops calling a dependency that is already failing. It protects the caller from waiting on repeated timeouts and protects the dependency from more load.

## Bulkhead

A resilience pattern that isolates resources. If one dependency is slow, it should not consume every request thread or connection in the whole service.

## Cache Stampede

A failure where many requests miss or bypass the cache at the same time and overload the database. Also called the thundering herd problem.

## Idempotency

The property that repeating the same command has the same effect as running it once. This is critical when clients retry writes.

## Consumer Lag

The distance between produced Kafka messages and consumed Kafka messages. High lag means the system may accept writes but process downstream workflows late.

## Saga

A distributed workflow made of multiple local transactions. If one step fails, the system uses retries or compensating actions instead of a single global transaction.

## Compensation

An action that semantically undoes or offsets a previous successful step in a saga. Example: if user registration succeeded but welcome-order creation failed, compensation might mark onboarding as failed or cancel the user onboarding workflow.

## Error Budget

The amount of unreliability a system can tolerate while still meeting its SLO. Senior incident discussions often frame reliability work around protecting the error budget.

## SLO

Service Level Objective. A measurable reliability target, such as "99% of user reads complete under 300ms over 30 days."

## P95 / P99 Latency

Percentile latency. P95 means 95% of requests are faster than this value and 5% are slower. Tail latency often reveals production pain better than averages.

## Load Shedding

Rejecting work intentionally to protect the system from collapse. Rate limiting with HTTP 429 is a form of load shedding.
