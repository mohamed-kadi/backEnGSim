#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

require_docker() {
  if ! command -v docker >/dev/null 2>&1; then
    printf "Docker is required for backend verification but was not found on PATH.\n" >&2
    exit 1
  fi

  if ! docker info >/dev/null 2>&1; then
    printf "Docker is installed but the daemon is not reachable. Start Docker Desktop and rerun this script.\n" >&2
    exit 1
  fi
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

printf "Starting verification infrastructure...\n"
require_docker
docker compose -f "$ROOT_DIR/docker-compose.yml" up -d postgres redis kafka
wait_for_command "postgres" 90 docker compose -f "$ROOT_DIR/docker-compose.yml" exec -T postgres pg_isready -U labuser -d backendlab
wait_for_command "kafka" 120 docker compose -f "$ROOT_DIR/docker-compose.yml" exec -T kafka /opt/kafka/bin/kafka-topics.sh --bootstrap-server localhost:9092 --list

printf "Running Java test suite...\n"
(cd "$ROOT_DIR" && mvn test)

printf "Building frontend...\n"
(cd "$ROOT_DIR/frontend" && npm run build)

printf "Verification complete.\n"
