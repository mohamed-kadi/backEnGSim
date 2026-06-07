# Backend Engineering Lab - Execution Plan

## PART 1: The Core Chaos Engine (MVP) - ✅ COMPLETED

_This phase represents the foundational engine capable of simulating and observing production backend failures._

### Phase 1: Foundation & Documentation

- [x] Core Scenario Engine implementation using Spring AOP
- [x] CI/CD pipeline with Contract Validation (REST Assured)
- [x] OpenAPI / Swagger configuration & Scenario Catalog Documentation

### Phase 2: Fault Library Expansion

- [x] `01-dto-regression`: Payload contract breaking
- [x] `02-api-latency`: Endpoint degradation (3s delay)
- [x] `03-db-connection`: Database connection failure
- [x] `04-cache-stampede`: Cache failure (5s delay + 500 error)
- [x] `05-write-failure`: DB Constraint/Lock failure

### Phase 3: Observability

- [x] Actuator and Prometheus metrics configuration
- [x] Dockerized Grafana and Prometheus setup
- [x] Custom micrometer metrics in AOP Aspects for fault tracking

### Phase 4: UI & Load Testing

- [x] Chaos Web Dashboard (HTML/JS) for dynamic toggling
- [x] Setup k6 continuous load testing script
- [x] Export a pre-configured Chaos Grafana Dashboard JSON

### Phase 5: Advanced Automation & Scenarios

- [x] Automate Grafana Data Source and Dashboard provisioning via Docker
- [x] Add `06-memory-leak` scenario to simulate JVM OutOfMemory errors
- [x] Integrate k6 load testing and scenario toggling into GitHub Actions CI

---

## PART 2: The Master Platform (Future Work) - ⏳ PAUSED

_This phase will wrap the Core Engine in a realistic engineering organization simulator._

### Phase 6: The Git Workflow Engine (✅ Completed)

- [x] Isolated Git repository generation for scenarios
- [x] Intentional regression commits (hidden bugs in history)
- [x] Training scenarios requiring `git bisect`, `git blame`, and safe rollbacks

### Phase 7: Advanced Learner Frontend (✅ Completed)

- [x] Migrate simple HTML dashboard to React + TypeScript (Initial Scaffold)
- [x] Embed Monaco code editor
- [x] Embed live terminal/log viewer
- [x] Live CI/CD pipeline and Git visualization panels

### Phase 8: Engineering Communication Layer (✅ Completed)

- [x] AI-driven incident reports
- [x] Translation of architectural failures into senior engineering jargon (Visual Topology)

### Phase 9: System Design & Distributed Architecture (✅ Completed)

- [x] Add a secondary microservice (e.g., `OrderService`) to teach network boundaries
- [x] Integrate Apache Kafka to teach event-driven architecture and asynchronous processing
- [x] New Scenario: Kafka Consumer Lag
- [x] New Scenario: Distributed Transaction (Saga) failures
- [x] New Scenario: API Rate Limiting

### Phase 10: Domain-Driven Design (DDD) Refactoring Labs

- [ ] Refactor anemic models into Aggregate Roots and Value Objects
- [ ] New Scenarios: Business Invariant Breaches, Bounded Context leakage

### Phase 11: Multi-Stack Plugin Architecture

- [ ] Refactor platform to be stack-agnostic (support Node.js, Go, Python via plugins)
- [ ] Orchestrate runtime containers dynamically based on learner selection
