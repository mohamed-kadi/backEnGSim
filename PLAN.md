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

Status: planned

Goal: make saved learner work reviewable from the dashboard without needing to export immediately.

Tasks:

- [ ] Add a dashboard view listing saved notes by scenario.
- [ ] Show completion state and last updated time.
- [ ] Add quick actions: open scenario, export report, mark complete.

Recommended commit:

```bash
git commit -m "feat: add report history view"
```

### 3. DDD Learning Track

Status: planned

Goal: teach DDD concepts through the same scenario/runbook model.

Tasks:

- [ ] Add DDD glossary cards to the dashboard.
- [ ] Add exercises for aggregates, value objects, invariants, and bounded contexts.
- [ ] Add one scenario for bounded-context leakage.
- [ ] Add one scenario for business invariant breach.

Recommended commit:

```bash
git commit -m "feat: add ddd learning track"
```

## Backlog

- [ ] Persist exported reports as first-class backend records.
- [ ] Add report diffing between first diagnosis and final diagnosis.
- [ ] Add scenario completion badges to scenario catalog buttons.
- [ ] Add dependency-specific drills for PostgreSQL, Redis, Kafka, and HTTP clients.
- [ ] Add rate-limiting and retry policy exercises.
- [ ] Add OpenAPI contract-diff learning scenario.
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

## Working Rules

- Keep implementation batches small.
- Commit after each verified batch.
- Update this plan when the roadmap changes.
- Prefer learning value over feature breadth.
- Document senior vocabulary whenever a new backend concept is introduced.
