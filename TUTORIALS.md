# Backend Engineering Lab: Tutorials & Scenarios

Welcome to the Backend Engineering Lab. This platform is not a standard "CRUD tutorial"—it is an **Incident Response and Production Debugging Simulator**.

The scenarios below are designed to teach you how to think like a Senior Site Reliability Engineer (SRE) and Backend Developer by exposing you to real-world failures.

---

## How To Use A Scenario

For every scenario, follow the same learning loop:

1. Run the system in normal mode and capture the baseline.
2. Activate the incident from the dashboard or API.
3. Trigger the affected endpoint.
4. Read the logs, HTTP response, system map, and dashboard learning panel.
5. Explain the failure using the senior diagnosis.
6. Propose a remediation and write down the tradeoff.

The point is not to memorize the exception. The point is to learn which boundary failed and how a production engineer would reason about it.

---

## The Chaos Engineering Scenarios

These scenarios are injected dynamically into the running application via the Chaos Dashboard. They teach you how to read telemetry (Grafana/Prometheus) and understand how infrastructure fails under load.

### `01-dto-regression`: Payload Contract Breaking

- **What it does:** Silently drops the `email` field from the User response payload.
- **What it teaches:** API Parity and Contract Testing. In microservice architectures, silently changing JSON structures causes downstream frontend applications to crash with `NullPointerExceptions` or `undefined` errors. You learn how to use Contract Tests (via RestAssured) to catch these in CI/CD before they hit production.

### `02-api-latency`: API Degradation (3s Delay)

- **What it does:** Forces the backend to sleep for 3 seconds on every request.
- **What it teaches:** Synchronous blocking and thread exhaustion. You learn how to identify latency spikes on a Grafana P95 dashboard, and understand how one slow endpoint can back up an entire system, eventually causing connection timeouts for the user.

### `03-db-connection`: Database Connection Drop

- **What it does:** Throws a `DataAccessResourceFailureException` when the database is accessed.
- **What it teaches:** Infrastructure volatility. Databases restart, networks blip, and connection pools run out of connections. You learn what a `500 Internal Server Error` looks like when the primary data store vanishes, and why applications need Circuit Breakers (like Resilience4j).

### `04-cache-stampede`: Redis Cache Failure (5s Delay + 500 Error)

- **What it does:** Simulates a massive delay followed by a runtime crash.
- **What it teaches:** The "Thundering Herd" problem. When a fast cache (Redis) dies, all traffic hits the slower Database simultaneously. The database cannot handle the sudden load, leading to a massive latency spike followed immediately by cascading system failures.

### `05-write-failure`: Database Constraint / Lock Timeout

- **What it does:** Throws a `DataIntegrityViolationException` on POST requests.
- **What it teaches:** Race conditions and database constraints. You learn what happens when two users try to register the same email at the exact same millisecond, or when a database table is locked by a long-running transaction.

### `06-memory-leak`: JVM OutOfMemoryError

- **What it does:** Allocates 10MB of un-garbage-collected memory per request.
- **What it teaches:** Heap memory management and Garbage Collection (GC) pauses. You learn how memory leaks don't crash systems immediately; instead, they cause the server to slowly consume RAM until the JVM violently crashes under load.

---

## 🕵️‍♂️ The Git Workflow Labs (Deployment Failures)

These scenarios simulate broken CI/CD pipelines caused by bad code being merged into the repository. They teach you how to use Git as a debugging tool.

### Lab 01: The Redis Configuration Bug (`git-labs/01-redis-bug`)

- **The Scenario:** A developer accidentally changed the Redis port from `6379` to `6380` in a past commit, breaking the CI/CD pipeline.
- **What it teaches:**
  - **`git log`:** Reading the history of what changed.
  - **`git bisect`:** Using a binary search to test code backwards in time to rapidly pinpoint exactly which commit introduced the bug.
  - **`git revert`:** Safely creating a new commit that undoes the damage of the broken commit without rewriting shared history.

---

---

## Recommended Next Reading

- [docs/LEARNING_PATH.md](docs/LEARNING_PATH.md)
- [docs/SCENARIO_CATALOG.md](docs/SCENARIO_CATALOG.md)
- [docs/EXERCISES.md](docs/EXERCISES.md)
- [docs/GLOSSARY.md](docs/GLOSSARY.md)
