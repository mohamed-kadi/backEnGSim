#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RUNTIME_DIR="$ROOT_DIR/.lab"
PID_DIR="$RUNTIME_DIR/pids"

stop_process() {
  local name="$1"
  local pid_file="$PID_DIR/$name.pid"

  if [ ! -f "$pid_file" ]; then
    printf "%s is not recorded as running\n" "$name"
    return 0
  fi

  local pid
  pid="$(cat "$pid_file")"
  if kill -0 "$pid" >/dev/null 2>&1; then
    printf "Stopping %s pid %s...\n" "$name" "$pid"
    kill "$pid"
  else
    printf "%s pid %s is already stopped\n" "$name" "$pid"
  fi
  rm -f "$pid_file"
}

stop_process "frontend"
stop_process "order-service"
stop_process "backend"

printf "Stopping Docker infrastructure...\n"
docker compose -f "$ROOT_DIR/docker-compose.yml" down

printf "Local lab processes stopped. Runtime logs remain in %s/logs.\n" "$RUNTIME_DIR"
