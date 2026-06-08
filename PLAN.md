# Backend Engineering Lab - Living Roadmap

This plan is the working source of truth for the project. It tracks what has been implemented, what should happen next, and how each batch should be verified before pushing.

## Product Purpose

Backend Engineering Lab is a hands-on learning platform for backend systems, production debugging, DDD, system design, SRE habits, and senior engineering communication.

The platform should help a learner:

- Trigger realistic backend failure scenarios.
- Observe logs, dependency health, and system boundaries.
- Learn the vocabulary behind each failure.
- Write incident notes and export incident reports.
- Track progress through backend/system-design topics.

## Long-Term Product Vision

Backend Engineering Lab should evolve into an interactive backend systems simulator: a realistic but approachable commerce/onboarding platform where learners can trigger failures across APIs, databases, caches, queues, payments, notifications, distributed workflows, observability, and deployment pipelines.

The long-term product should teach how backend systems behave in production, not just how to write CRUD endpoints. Every new feature should connect a normal business workflow to a failure mode, an investigation path, senior vocabulary, a remediation strategy, and a system-design tradeoff.

Target learner outcomes:

- Understand how real backend components cooperate in a full system.
- Learn production debugging through evidence, not guessing.
- Practice senior backend vocabulary in incident reports and design reviews.
- Compare architecture tradeoffs: consistency vs availability, sync vs async, retry vs fail-fast, cache freshness vs latency, orchestration vs choreography.
- Build intuition for system design interviews and real production work.

### Long-Term Learning Tracks

Each track should be implemented as scenarios, runbooks, exercises, docs, and tests.

#### 1. API Contracts And Compatibility

Purpose: teach API design, schema evolution, backward compatibility, generated clients, and contract testing.

Example topics:

- REST resource design.
- OpenAPI documentation.
- Contract diffs.
- Backward-compatible response evolution.
- API versioning.
- Consumer-driven contracts.

Current foundation:

- `01-dto-regression`
- `10-openapi-contract-drift`

Future scenarios:

- Removing a required field from a response.
- Changing an enum value without client migration.
- Returning a new error shape that frontend clients cannot parse.
- Introducing an incompatible OpenAPI spec change and catching it in CI.

#### 2. Persistence And Data Modeling

Purpose: teach transactional systems, relational modeling, indexes, migrations, constraints, consistency, and failure semantics.

Example topics:

- PostgreSQL schema design.
- Transactions and isolation levels.
- Optimistic and pessimistic locking.
- Unique constraints and business invariants.
- Online migrations.
- Read/write separation.

Current foundation:

- `03-db-connection`
- `05-write-failure`

Future scenarios:

- Missing index causes slow query under load.
- Migration breaks an existing endpoint.
- Duplicate command creates duplicate business records.
- Lost update from concurrent writes.
- Read replica lag causes stale data.

#### 3. Caching And Performance

Purpose: teach Redis, cache-aside, TTLs, hot keys, stale reads, invalidation, and performance tradeoffs.

Example topics:

- Cache-aside pattern.
- TTL jitter.
- Cache stampede prevention.
- Request coalescing.
- Stale-while-revalidate.
- Hot-key mitigation.

Current foundation:

- `04-cache-stampede`

Future scenarios:

- Stale profile/order data after write.
- Hot key overload.
- Cache invalidation bug.
- Redis outage with graceful fallback.
- Cache memory pressure and eviction surprises.

#### 4. Async Messaging And Event-Driven Systems

Purpose: teach Kafka, queues, eventual consistency, consumer lag, retries, dead-letter queues, outbox, ordering, and replay.

Example topics:

- Producer vs consumer failure.
- Consumer groups and partitions.
- Event ordering.
- DLQ design.
- Transactional outbox.
- Replay safety.

Current foundation:

- `07-kafka-consumer-lag`

Future scenarios:

- Event published before DB commit.
- Duplicate event causes duplicate side effect.
- Poison message blocks consumer progress.
- Missing DLQ loses failed notifications.
- Out-of-order events corrupt derived state.

#### 5. Payments And Financial Workflows

Purpose: teach one of the most important backend domains: idempotent commands, ledgers, external provider integration, webhooks, refunds, and auditability.

Example topics:

- Payment intent.
- Authorization and capture.
- Refunds.
- Idempotency keys.
- Ledger entries.
- Provider webhooks.
- Reconciliation.

Future implementation direction:

- Add `payment-service` or a payment module.
- Model payment authorization for an order.
- Store payment attempts and immutable ledger entries.
- Simulate provider timeout, duplicate webhook, failed capture, and refund flow.

Future scenarios:

- Client retries payment without an idempotency key.
- Payment provider authorizes but webhook arrives late.
- Duplicate webhook creates duplicate fulfillment.
- Refund succeeds at provider but local ledger update fails.
- Payment capture times out and status is unknown.

#### 6. Notifications And Communication Workflows

Purpose: teach async delivery, retries, templates, provider outages, user preferences, and notification observability.

Example topics:

- Email/SMS/push provider boundaries.
- Retry queues.
- Template versioning.
- Delivery status.
- User preference checks.
- Idempotent notification sends.

Future implementation direction:

- Add notification workflow after user registration, order creation, or payment success.
- Use Kafka or a queue to decouple notification sends from request paths.

Future scenarios:

- Email provider outage.
- Notification template missing required variable.
- Duplicate notification from retry.
- User opted out but notification still sent.
- Delayed notification breaks business SLA.

#### 7. Distributed Workflows And Sagas

Purpose: teach multi-service workflows, partial failure, compensation, orchestration, choreography, and consistency boundaries.

Example topics:

- Saga state machines.
- Compensation.
- Idempotent downstream commands.
- Outbox and inbox patterns.
- Workflow orchestration.
- Partial commits.

Current foundation:

- `08-saga-failure`
- `order-service`

Future scenarios:

- User created but order creation fails.
- Order created but payment fails.
- Payment succeeds but notification fails.
- Compensation fails and needs manual review.
- Choreographed events produce inconsistent workflow state.

#### 8. Reliability, Scale, And Traffic Management

Purpose: teach load balancing, rate limiting, backpressure, timeouts, retries, circuit breakers, bulkheads, and graceful degradation.

Example topics:

- Load balancing.
- Horizontal scaling.
- Connection pool saturation.
- Timeout budgets.
- Retry budgets.
- Circuit breakers.
- Backpressure.
- Graceful shutdown.

Current foundation:

- `02-api-latency`
- `09-rate-limiting`
- Resilience exercises in the runbook.

Future scenarios:

- Retry storm amplifies provider outage.
- Load balancer sends traffic to unhealthy instance.
- Connection pool exhaustion under load.
- Missing timeout causes thread starvation.
- Graceful shutdown drops in-flight requests.

#### 9. Observability And Operations

Purpose: teach logs, metrics, traces, dashboards, alerts, SLOs, incident reports, and operational decision-making.

Example topics:

- Structured logs.
- Metrics and cardinality.
- Distributed tracing.
- SLOs and error budgets.
- Alert fatigue.
- Incident timelines.
- Runbook quality.

Current foundation:

- Live logs panel.
- Prometheus/Grafana infrastructure.
- Incident reports.
- Dependency health.

Future scenarios:

- Missing correlation ID makes distributed debugging hard.
- High-cardinality metric harms observability.
- Alert fires on symptom but misses root cause.
- Dashboard shows averages instead of percentiles.
- Incident report lacks evidence and remediation.

#### 10. Security, Identity, And Compliance

Purpose: teach backend security basics without turning the project into a security-only lab.

Example topics:

- Authentication.
- Authorization and RBAC.
- Service-to-service auth.
- Secrets management.
- PII handling.
- Audit logs.
- Input validation.

Future scenarios:

- Endpoint missing authorization check.
- PII leaked into logs.
- Secret committed to config.
- Service accepts unsigned webhook.
- Admin action missing audit trail.

#### 11. DDD And Architecture

Purpose: teach how to organize growing backend systems around domain language, invariants, boundaries, and business workflows.

Example topics:

- Entity.
- Value object.
- Aggregate.
- Invariant.
- Repository.
- Domain service.
- Domain event.
- Bounded context.
- Anti-corruption layer.
- Modular monolith vs microservices.

Future scenarios:

- Bounded-context leakage between User, Order, Payment, and Notification.
- Business invariant breach from anemic models.
- Domain event published with wrong meaning.
- External provider model leaks into internal payment domain.

### Product Design Rule For Future Features

Every major feature should include:

- A happy-path workflow.
- At least one realistic failure scenario.
- A scenario catalog entry.
- A guided runbook.
- Vocabulary cards or glossary entries.
- Evidence prompts.
- Remediation prompts.
- Tests proving the failure behavior.
- Documentation in the learning path or exercises.
- Dashboard visibility through the system map, inspector, or focused workspace.

Avoid adding services only for decoration. A service exists when it teaches a boundary, tradeoff, or operational behavior.

### Target Domain Model

The platform should gradually become a realistic commerce/onboarding system:

- A user registers.
- An order is created.
- A payment is authorized and captured.
- Domain events are published.
- Notifications are sent.
- Audit/report records are stored.
- Operations are observable through logs, metrics, traces, and dependency health.

This domain gives every backend topic a natural place:

- Users teach identity, contracts, and DDD entities.
- Orders teach workflow and business invariants.
- Payments teach idempotency, ledgers, and external providers.
- Notifications teach async delivery and retries.
- Kafka teaches event-driven boundaries.
- PostgreSQL teaches transactions and consistency.
- Redis teaches caching and performance.
- Observability teaches production debugging.

## Completed Milestones

### Core Failure Simulation

- [x] Spring Boot backend with scenario engine.
- [x] Spring AOP fault injection through `FaultInjectionAspect`.
- [x] Scenario catalog exposed through `/api/_system/scenario/catalog`.
- [x] Fault scenarios:
  - [x] `01-dto-regression`
  - [x] `02-api-latency`
  - [x] `03-db-connection`
  - [x] `04-cache-stampede`
  - [x] `05-write-failure`
  - [x] `06-memory-leak`
  - [x] `07-kafka-consumer-lag`
  - [x] `08-saga-failure`
  - [x] `09-rate-limiting`
  - [x] `10-openapi-contract-drift`

### Distributed Systems Environment

- [x] PostgreSQL, Redis, Kafka, Prometheus, and Grafana through Docker Compose.
- [x] Secondary `order-service` for cross-service and saga-style learning.
- [x] Kafka producer/consumer path for async event learning.
- [x] Dependency health endpoint at `/api/_system/dependencies`.
- [x] System map in the React dashboard.

### Local Developer Workflow

- [x] `scripts/dev-up.sh` starts infra, backend, order service, and frontend.
- [x] `scripts/dev-down.sh` stops local lab processes.
- [x] Vite dashboard pinned to `5173` with strict port behavior.
- [x] Startup scripts fail clearly on port conflicts.
- [x] Spring `dev` and `test` profiles.
- [x] Backend contract tests run against H2 under the `test` profile.

### Learning Experience

- [x] React + TypeScript dashboard.
- [x] Scenario catalog cards.
- [x] Live logs panel.
- [x] Monaco configuration editor.
- [x] CI/CD pipeline simulator.
- [x] Guided incident runbook.
- [x] Learner notes persisted through `/api/_learning/notes`.
- [x] Browser-local fallback for notes if the backend is unavailable.
- [x] Learning progress panel by scenario and category.
- [x] Markdown incident report export.
- [x] Sidebar-based dashboard workspace layout.

### Documentation

- [x] `README.md` project overview and local startup.
- [x] `TUTORIALS.md` scenario walkthroughs.
- [x] `docs/LEARNING_PATH.md`.
- [x] `docs/GLOSSARY.md`.
- [x] `docs/SCENARIO_CATALOG.md`.
- [x] `docs/EXERCISES.md`.

## Current Implementation Sequence

Each item should be implemented and committed as a separate batch.

### 1. Learning Note Validation

Status: completed

Goal: keep saved learner notes predictable and safe.

Tasks:

- [x] Add Bean Validation to `LearningNoteRequest`.
- [x] Enforce max note length.
- [x] Normalize blank/null notes to an empty string.
- [x] Return `400 Bad Request` for invalid learning note payloads.
- [x] Add contract tests for validation behavior.

Recommended commit:

```bash
git commit -m "feat: validate learning notes"
```

### 2. Report History

Status: completed

Goal: make saved learner work reviewable from the dashboard without needing to export immediately.

Tasks:

- [x] Add a dashboard view listing saved notes by scenario.
- [x] Show completion state and last updated time.
- [x] Add quick actions: open scenario, export report, mark complete.

Recommended commit:

```bash
git commit -m "feat: add report history view"
```

### 3. Dashboard Workspace Layout Refactor

Status: completed

Goal: keep the growing dashboard usable by grouping features into focused workspace views.

Tasks:

- [x] Add sidebar navigation.
- [x] Move long-scroll content into focused views.
- [x] Keep active scenario status visible globally.
- [x] Add right-side inspector for active scenario, dependency alerts, and quick actions.
- [x] Add latest events to the inspector so learners do not need duplicate terminals.
- [x] Add direct Runbook to System evidence navigation.
- [x] Fix dependency status badge overflow inside system map cards.
- [x] Keep the full system map only in the System view.
- [x] Add affected-component hints to scenario cards.
- [x] Keep compact dependency health in the global inspector.
- [x] Add scenario completion badges to scenario catalog buttons.
- [x] Add dependency-specific drills for PostgreSQL, Redis, Kafka, and HTTP/order-service.
- [x] Add rate-limiting and retry policy exercises to the incident runbook.

Recommended commit:

```bash
git commit -m "feat: organize dashboard workspace"
```

### 4. OpenAPI Contract Drift Scenario

Status: completed

Goal: teach API schema evolution and contract-diff thinking through a runtime failure.

Tasks:

- [x] Add `10-openapi-contract-drift` to the backend scenario catalog.
- [x] Inject a backward-incompatible `email` to `contactEmail` response rename.
- [x] Add a contract test that proves the drift behavior.
- [x] Map the scenario into dashboard icon, topology, and pipeline views.
- [x] Document the scenario in tutorials, exercises, and the scenario catalog.

Recommended commit:

```bash
git commit -m "feat: add openapi contract drift scenario"
```

### 5. DDD Learning Track

Status: in progress

Goal: teach DDD concepts through the same scenario/runbook model.

Tasks:

- [x] Add DDD glossary cards to the dashboard.
- [x] Add exercises for aggregates, value objects, invariants, and bounded contexts.
- [ ] Add one scenario for bounded-context leakage.
- [ ] Add one scenario for business invariant breach.

Recommended commit:

```bash
git commit -m "feat: add ddd learning track"
```

### 6. Commerce Workflow Foundation

Status: planned

Goal: turn the lab from isolated examples into a coherent commerce/onboarding workflow.

Tasks:

- [ ] Define domain language for User, Order, Payment, Notification, and Audit.
- [ ] Add a dashboard architecture view for the target workflow.
- [ ] Add docs explaining the end-to-end happy path.
- [ ] Add seed/demo actions for user registration, order creation, payment authorization, and notification delivery.

Recommended commit:

```bash
git commit -m "feat: add commerce workflow foundation"
```

### 7. Payment Learning Track

Status: planned

Goal: teach payment-provider integration, idempotency, ledger thinking, webhooks, refunds, and reconciliation.

Tasks:

- [ ] Add payment domain model or `payment-service`.
- [ ] Add payment authorization and capture happy path.
- [ ] Add idempotency-key handling for payment commands.
- [ ] Add immutable payment ledger/audit records.
- [ ] Add webhook simulation endpoint.
- [ ] Add scenarios for provider timeout, duplicate webhook, failed capture, and refund inconsistency.
- [ ] Add runbooks, exercises, and tests for each payment scenario.

Recommended commit:

```bash
git commit -m "feat: add payment learning track"
```

### 8. Notification Learning Track

Status: planned

Goal: teach async delivery, retry queues, provider failures, template safety, and user communication workflows.

Tasks:

- [ ] Add notification workflow for user/order/payment events.
- [ ] Add notification status records.
- [ ] Add provider abstraction for email/SMS/push simulation.
- [ ] Add retry and failure handling.
- [ ] Add scenarios for provider outage, duplicate notification, template error, opt-out violation, and delayed delivery.
- [ ] Add runbooks, exercises, and tests.

Recommended commit:

```bash
git commit -m "feat: add notification learning track"
```

### 9. Messaging Reliability Track

Status: planned

Goal: deepen Kafka/event-driven learning beyond consumer lag.

Tasks:

- [ ] Add transactional outbox pattern.
- [ ] Add inbox/deduplication pattern for consumers.
- [ ] Add dead-letter queue simulation.
- [ ] Add event replay exercises.
- [ ] Add scenarios for duplicate event, poison message, out-of-order event, and event-before-commit bug.

Recommended commit:

```bash
git commit -m "feat: add messaging reliability track"
```

### 10. Scale And Resilience Track

Status: planned

Goal: teach traffic management, load balancing, backpressure, timeout budgets, retry budgets, and graceful degradation.

Tasks:

- [ ] Add load-test presets for each major workflow.
- [ ] Add circuit breaker and timeout examples.
- [ ] Add connection-pool saturation scenario.
- [ ] Add retry-storm scenario.
- [ ] Add load-balancer/unhealthy-instance scenario.
- [ ] Add graceful-shutdown scenario.

Recommended commit:

```bash
git commit -m "feat: add scale resilience track"
```

### 11. Observability And Incident Operations Track

Status: planned

Goal: teach production operations through logs, metrics, traces, SLOs, alerts, and incident communication.

Tasks:

- [ ] Add correlation IDs across backend, order, payment, and notification workflows.
- [ ] Add structured log examples.
- [ ] Add tracing or trace-like request timeline view.
- [ ] Add SLO/error-budget dashboard concepts.
- [ ] Add scenarios for missing correlation ID, bad alert threshold, high-cardinality metric, and misleading average latency.
- [ ] Add incident timeline and report-quality exercises.

Recommended commit:

```bash
git commit -m "feat: add observability operations track"
```

### 12. Security And Compliance Track

Status: planned

Goal: teach practical backend security boundaries in the context of a realistic system.

Tasks:

- [ ] Add authentication and authorization model.
- [ ] Add role-based access examples.
- [ ] Add service-to-service auth concept.
- [ ] Add audit log model.
- [ ] Add PII handling guidance.
- [ ] Add scenarios for missing authorization, PII log leak, unsigned webhook, and missing audit trail.

Recommended commit:

```bash
git commit -m "feat: add security compliance track"
```

## Backlog

- [ ] Persist exported reports as first-class backend records.
- [ ] Add report diffing between first diagnosis and final diagnosis.
- [ ] Add Git workflow labs for `git bisect`, rollback, and regression analysis.
- [ ] Add CI workflow that runs backend tests, frontend build, and smoke checks.

## Verification Checklist

Run the smallest relevant checks for each batch:

```bash
cd backend && mvn test
cd order-service && mvn test
cd frontend && npm run build
bash -n scripts/dev-up.sh
bash -n scripts/dev-down.sh
git diff --check
```

Use `./scripts/verify.sh` for broader verification when Docker Desktop is running.

## Commit Milestones

- `dff69ff` - bootstrap backend engineering lab platform
- `d11d95a` - add learning path and scenario guides
- `38f05ae` - add observability and load test workflow
- `7c16130` - add local workflow scripts and exercises
- `3e6b21b` - add system map dependency health panel
- `da4e6b4` - harden dashboard startup
- `7298870` - add dev and test Spring profiles
- `22123de` - add guided incident runbook
- `c01e66f` - persist learning notes
- `77739e3` - add learning progress panel
- `c4351e4` - export incident reports
- `3ee7768` - validate learning notes
- `c5de821` - add report history view
- `5cd639a` - organize dashboard workspace
- `7570376` - improve investigation workspace flow

## Working Rules

- Keep implementation batches small.
- Commit after each verified batch.
- Update this plan when the roadmap changes.
- Prefer learning value over feature breadth.
- Document senior vocabulary whenever a new backend concept is introduced.
