#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RUNTIME_DIR="$ROOT_DIR/.lab"
LOG_DIR="$RUNTIME_DIR/logs"
PID_DIR="$RUNTIME_DIR/pids"

mkdir -p "$LOG_DIR" "$PID_DIR"

require_docker() {
  if ! command -v docker >/dev/null 2>&1; then
    printf "Docker is required but was not found on PATH.\n" >&2
    exit 1
  fi

  if ! docker info >/dev/null 2>&1; then
    printf "Docker is installed but the daemon is not reachable. Start Docker Desktop and rerun this script.\n" >&2
    exit 1
  fi
}

wait_for_url() {
  local name="$1"
  local url="$2"
  local timeout_seconds="${3:-90}"
  local start
  start="$(date +%s)"

  printf "Waiting for %s at %s" "$name" "$url"
  until curl -fsS "$url" >/dev/null 2>&1; do
    if [ "$(($(date +%s) - start))" -ge "$timeout_seconds" ]; then
      printf "\n%s did not become ready within %ss. Check logs in %s.\n" "$name" "$timeout_seconds" "$LOG_DIR" >&2
      return 1
    fi
    printf "."
    sleep 2
  done
  printf " ready\n"
}

wait_for_command() {
  local name="$1"
  local timeout_seconds="$2"
  shift 2
  local start
  start="$(date +%s)"

  printf "Waiting for %s" "$name"
  until "$@" >/dev/null 2>&1; do
    if [ "$(($(date +%s) - start))" -ge "$timeout_seconds" ]; then
      printf "\n%s did not become ready within %ss.\n" "$name" "$timeout_seconds" >&2
      return 1
    fi
    printf "."
    sleep 2
  done
  printf " ready\n"
}

remove_stale_pid() {
  local name="$1"
  local pid_file="$PID_DIR/$name.pid"

  if [ -f "$pid_file" ] && ! kill -0 "$(cat "$pid_file")" >/dev/null 2>&1; then
    printf "Removing stale pid file for %s\n" "$name"
    rm -f "$pid_file"
  fi
}

port_owner() {
  local port="$1"

  if command -v lsof >/dev/null 2>&1; then
    lsof -ti "tcp:$port" -sTCP:LISTEN 2>/dev/null | head -n 1
  fi
}

ensure_url_ready_or_port_free() {
  local name="$1"
  local port="$2"
  local health_url="$3"

  if curl -fsS "$health_url" >/dev/null 2>&1; then
    printf "%s already reachable on port %s; reusing it.\n" "$name" "$port"
    return 0
  fi

  local owner
  owner="$(port_owner "$port" || true)"
  if [ -n "$owner" ]; then
    printf "Port %s is already in use by pid %s, but %s is not healthy at %s.\n" "$port" "$owner" "$name" "$health_url" >&2
    printf "Stop that process or run ./scripts/dev-down.sh, then rerun ./scripts/dev-up.sh.\n" >&2
    exit 1
  fi

  return 1
}

ensure_frontend_ready_or_port_free() {
  local port=5173
  local url="http://127.0.0.1:${port}"

  if curl -fsS "$url" 2>/dev/null | grep -q "Backend Lab - SRE Dashboard"; then
    printf "frontend already reachable on port %s; reusing it.\n" "$port"
    return 0
  fi

  local owner
  owner="$(port_owner "$port" || true)"
  if [ -n "$owner" ]; then
    printf "Port %s is already in use by pid %s, but it is not serving the Backend Lab dashboard.\n" "$port" "$owner" >&2
    printf "Stop that process or run ./scripts/dev-down.sh, then rerun ./scripts/dev-up.sh.\n" >&2
    exit 1
  fi

  return 1
}

start_process() {
  local name="$1"
  local workdir="$2"
  shift 2

  local pid_file="$PID_DIR/$name.pid"
  local log_file="$LOG_DIR/$name.log"

  remove_stale_pid "$name"

  if [ -f "$pid_file" ] && kill -0 "$(cat "$pid_file")" >/dev/null 2>&1; then
    printf "%s already running with pid %s\n" "$name" "$(cat "$pid_file")"
    return 0
  fi

  printf "Starting %s...\n" "$name"
  (
    cd "$workdir"
    "$@"
  ) >"$log_file" 2>&1 &
  echo "$!" >"$pid_file"
  printf "%s pid %s, log %s\n" "$name" "$(cat "$pid_file")" "$log_file"
}

printf "Starting Backend Engineering Lab infrastructure...\n"
require_docker
docker compose -f "$ROOT_DIR/docker-compose.yml" up -d
wait_for_command "postgres" 90 docker compose -f "$ROOT_DIR/docker-compose.yml" exec -T postgres pg_isready -U labuser -d backendlab
wait_for_command "kafka" 120 docker compose -f "$ROOT_DIR/docker-compose.yml" exec -T kafka /opt/kafka/bin/kafka-topics.sh --bootstrap-server localhost:9092 --list

if [ ! -d "$ROOT_DIR/frontend/node_modules" ]; then
  printf "Installing frontend dependencies...\n"
  (cd "$ROOT_DIR/frontend" && npm install)
fi

if ! ensure_url_ready_or_port_free "backend" 8080 "http://127.0.0.1:8080/actuator/health"; then
  start_process "backend" "$ROOT_DIR/backend" mvn spring-boot:run
fi
wait_for_url "backend" "http://127.0.0.1:8080/actuator/health" 120

if ! ensure_url_ready_or_port_free "order-service" 8081 "http://127.0.0.1:8081/actuator/health"; then
  start_process "order-service" "$ROOT_DIR/order-service" mvn spring-boot:run
fi
wait_for_url "order-service" "http://127.0.0.1:8081/actuator/health" 90

if ! ensure_frontend_ready_or_port_free; then
  start_process "frontend" "$ROOT_DIR/frontend" npm run dev -- --host 0.0.0.0 --port 5173 --strictPort
fi
wait_for_url "frontend" "http://127.0.0.1:5173" 90

cat <<EOF

Backend Engineering Lab is running.

Dashboard:     http://localhost:5173
Backend API:   http://localhost:8080
Order service: http://localhost:8081
Prometheus:    http://localhost:9090
Grafana:       http://localhost:3000

Logs:
  $LOG_DIR/backend.log
  $LOG_DIR/order-service.log
  $LOG_DIR/frontend.log

Stop everything with:
  ./scripts/dev-down.sh
EOF
