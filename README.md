# Backend Engineering Lab

Backend Engineering Lab is a production-debugging and system-design training platform. It gives learners a realistic Spring Boot microservice environment where they can trigger failures, inspect behavior, and practice explaining incidents with senior backend engineering language.

## Overview

This application uses **Spring Boot**, **PostgreSQL**, **Redis**, **Kafka**, **Prometheus**, **Grafana**, **k6**, and a React dashboard. It includes a built-in `ScenarioEngine` that can dynamically inject faults without redeploying code.

The goal is not only to see failures. The goal is to learn how to reason about them:

- What failed?
- Which system boundary is involved?
- What evidence should a backend engineer collect?
- Which terms should be used in an incident report or design review?
- What remediation would a senior engineer propose?

### Architecture Overview

The core of the fault injection relies on **Spring AOP (Aspect-Oriented Programming)**. 
1. The **ScenarioEngine** maintains the state of the active incident in memory.
2. **FaultInjectionAspect** listens to specific method executions (like Controller endpoints or Repository calls).
3. If an aspect detects that its corresponding scenario is active, it intercepts the call to mutate the response, add latency, or throw exceptions.
4. The **ScenarioCatalog** documents each scenario and exposes it to the dashboard through `/api/_system/scenario/catalog`.

### Services

- `backend`: main Spring Boot service with the User API, scenario engine, Kafka producer/consumer, and fault injection.
- `order-service`: secondary Spring Boot service used to teach cross-service calls and saga-style failures.
- `frontend`: React dashboard used to activate incidents and study the learning notes.
- `docker-compose.yml`: local infrastructure for PostgreSQL, Redis, Kafka, Prometheus, and Grafana.

The dashboard includes a **System Map & Dependency Health** panel. It shows the live status of PostgreSQL, Redis, Kafka, and the order service, then highlights the components affected by the active scenario.

It also includes a **Guided Incident Runbook**. When a scenario is active, the dashboard shows what broke, where to collect evidence, which senior backend terms apply, and a local notes workspace for writing an incident diagnosis.

Learner notes and scenario completion state are persisted through the backend learning API, with browser-local fallback when the backend is unavailable.

The dashboard also includes a **Learning Progress** panel that summarizes completed scenarios, remaining scenarios, and coverage by failure category.

Learners can export each active scenario as a Markdown incident report from the runbook, including their notes, affected components, evidence prompts, senior diagnosis, remediation, and checklist.

## Learning Material

Start with these files:

- [TUTORIALS.md](TUTORIALS.md): guided scenario walkthroughs.
- [docs/LEARNING_PATH.md](docs/LEARNING_PATH.md): recommended path from beginner to advanced topics.
- [docs/SCENARIO_CATALOG.md](docs/SCENARIO_CATALOG.md): full incident catalog and investigation prompts.
- [docs/EXERCISES.md](docs/EXERCISES.md): hands-on prompts for incident notes, DDD reflection, and system-design practice.
- [docs/GLOSSARY.md](docs/GLOSSARY.md): senior backend, DDD, SRE, and system-design vocabulary.

## Prerequisites

- Java 17
- Maven
- Docker
- Node.js 18+ for the React dashboard

## Getting Started

### 1. Environment Setup

Copy the example environment variables file and update it if necessary:

```bash
cp .env.example .env
```

### 2. Start Infrastructure

The fastest local startup is:

```bash
./scripts/dev-up.sh
```

This starts Docker infrastructure, the backend, the order service, and the React dashboard. Logs and process IDs are stored under `.lab/`.

`dev-up.sh` keeps the dashboard pinned to `http://localhost:5173`. If another process is already using `5173`, `8080`, or `8081`, the script stops with the blocking PID instead of silently moving the dashboard to a different port.

Stop everything with:

```bash
./scripts/dev-down.sh
```

If you prefer manual startup, start PostgreSQL, Redis, Kafka, Prometheus, and Grafana first:

```bash
docker-compose up -d
```

### 3. Run the Backend

Run the main backend:

```bash
cd backend
mvn spring-boot:run -Dspring-boot.run.profiles=dev
```

Run the order service in a second terminal:

```bash
cd order-service
mvn spring-boot:run -Dspring-boot.run.profiles=dev
```

Run the dashboard in a third terminal:

```bash
cd frontend
npm install
npm run dev
```

Default local URLs:

- Backend API: `http://localhost:8080`
- Order service: `http://localhost:8081`
- Dashboard: `http://localhost:5173`
- Prometheus: `http://localhost:9090`
- Grafana: `http://localhost:3000`

If the dashboard shows a blank or stale page, stop the lab and start it again:

```bash
./scripts/dev-down.sh
./scripts/dev-up.sh
```

If startup still reports a port conflict, stop the process shown by the script or change the conflicting local service before rerunning `dev-up.sh`.

### Spring Profiles

- `dev`: local learning environment. Uses Docker-backed PostgreSQL, Redis, Kafka, and the local order service.
- `test`: automated test environment. Uses in-memory H2 for backend persistence, disables Kafka listener startup, shortens Kafka producer timeouts, and reduces framework log noise.

### 4. Verify

```bash
./scripts/verify.sh
```

The verification script starts the required Docker test infrastructure before running Maven and the frontend build.

## Fault Injection API

The platform exposes endpoints to trigger incident scenarios dynamically:

- `POST /api/_system/scenario/activate/{id}`: Activates a specific failure scenario (e.g., `01-dto-regression`).
- `POST /api/_system/scenario/reset`: Returns the application to a normal state.
- `GET /api/_system/scenario/status`: Checks the current scenario status.
- `GET /api/_system/scenario/catalog`: Returns the documented training catalog used by the dashboard.
- `GET /api/_system/dependencies`: Returns live dependency status for the system map.

## Learning API

- `GET /api/_learning/notes`: Lists saved learning notes and completion state.
- `GET /api/_learning/notes/{scenarioId}`: Returns the notes for one scenario.
- `PUT /api/_learning/notes/{scenarioId}`: Saves learner notes and whether the scenario is complete.
