#!/usr/bin/env bash
set -euo pipefail

cmd=${1:?usage: serve.sh start|stop [port]}
port=${2:-4517}
root=$(git -C "$(dirname "$0")" rev-parse --show-toplevel)
run_dir=$root/.verify
pid_file=$run_dir/server-$port.pid
log_file=$run_dir/server-$port.log

pid_command() {
  # Minimal Linux images ship no ps, and macOS has no /proc.
  if [ -r "/proc/$1/cmdline" ]; then
    tr '\0' ' ' <"/proc/$1/cmdline"
  else
    ps -p "$1" -o command= 2>/dev/null
  fi
}

case $cmd in
  start)
    # Probe by binding, not lsof; minimal Linux images do not ship lsof.
    if ! node -e 'const s=require("net").createServer();s.once("error",()=>process.exit(1));s.listen(Number(process.argv[1]),"127.0.0.1",()=>s.close(()=>process.exit(0)))' "$port"; then
      echo "port $port is already in use; pick another port or run doctor.sh $port" >&2
      exit 1
    fi
    if [ ! -d "$root/.next" ]; then
      echo "no .next build in $root; run 'npm run build' first" >&2
      exit 1
    fi
    mkdir -p "$run_dir"
    # Spawn detached so the recorded pid is the server itself leading its own
    # process group; a backgrounded shell list records a wrapper shell instead.
    pid=$(cd "$root" && node -e '
      const { spawn } = require("child_process");
      const [port, log] = process.argv.slice(1);
      const fd = require("fs").openSync(log, "w");
      const child = spawn("node", ["node_modules/.bin/next", "start", "-p", port], { detached: true, stdio: ["ignore", fd, fd] });
      child.unref();
      console.log(child.pid);
    ' "$port" "$log_file")
    echo "$pid" >"$pid_file"
    for _ in $(seq 1 60); do
      if curl -fsS -o /dev/null "http://127.0.0.1:$port/" 2>/dev/null; then
        echo "ready on http://127.0.0.1:$port (pid $pid, log $log_file)"
        exit 0
      fi
      sleep 0.5
    done
    echo "server did not answer within 30s; killing pid $pid and removing its record; log tail:" >&2
    tail -20 "$log_file" >&2 || true
    kill -- "-$pid" 2>/dev/null || true
    rm -f "$pid_file"
    exit 1
    ;;
  stop)
    if [ ! -f "$pid_file" ]; then
      echo "no pid file at $pid_file; refusing to guess at a process to kill"
      exit 0
    fi
    pid=$(cat "$pid_file")
    if ! kill -0 "$pid" 2>/dev/null; then
      echo "stale pid file; recorded pid $pid is already dead. Removing the record."
      rm -f "$pid_file"
      exit 0
    fi
    cmd=$(pid_command "$pid" || true)
    case $cmd in
      *next-server*) ;;
      *)
        echo "stale pid file; pid $pid now belongs to another process ($cmd). Refusing to signal it and removing the record."
        rm -f "$pid_file"
        exit 0
        ;;
    esac
    kill -- "-$pid" 2>/dev/null || kill "$pid" 2>/dev/null || true
    rm -f "$pid_file"
    echo "stopped pid $pid"
    ;;
  *)
    echo "usage: serve.sh start|stop [port]" >&2
    exit 2
    ;;
esac
