#!/usr/bin/env bash
set -euo pipefail

cmd=${1:?usage: serve.sh start|stop [port]}
port=${2:-4517}
root=$(git -C "$(dirname "$0")" rev-parse --show-toplevel)
run_dir=$root/.verify
pid_file=$run_dir/server-$port.pid
log_file=$run_dir/server-$port.log

case $cmd in
  start)
    if lsof -nP -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1; then
      echo "port $port is already in use; pick another port or run doctor.sh $port" >&2
      exit 1
    fi
    if [ ! -d "$root/.next" ]; then
      echo "no .next build in $root; run 'npm run build' first" >&2
      exit 1
    fi
    mkdir -p "$run_dir"
    (cd "$root" && nohup node node_modules/.bin/next start -p "$port" >"$log_file" 2>&1 & echo $! >"$pid_file")
    for _ in $(seq 1 60); do
      if curl -fsS -o /dev/null "http://127.0.0.1:$port/" 2>/dev/null; then
        echo "ready on http://127.0.0.1:$port (pid $(cat "$pid_file"), log $log_file)"
        exit 0
      fi
      sleep 0.5
    done
    echo "server did not answer within 30s; log tail:" >&2
    tail -20 "$log_file" >&2 || true
    exit 1
    ;;
  stop)
    if [ ! -f "$pid_file" ]; then
      echo "no pid file at $pid_file; refusing to guess at a process to kill"
      exit 0
    fi
    pid=$(cat "$pid_file")
    pkill -P "$pid" 2>/dev/null || true
    kill "$pid" 2>/dev/null || true
    rm -f "$pid_file"
    echo "stopped pid $pid"
    ;;
  *)
    echo "usage: serve.sh start|stop [port]" >&2
    exit 2
    ;;
esac
