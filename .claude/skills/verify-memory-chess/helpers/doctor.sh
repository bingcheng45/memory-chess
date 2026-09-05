#!/usr/bin/env bash
set -euo pipefail

port=${1:-4517}
root=$(git -C "$(dirname "$0")" rev-parse --show-toplevel)
pid_file=$root/.verify/server-$port.pid

pid_command() {
  # Minimal Linux images ship no ps, and macOS has no /proc.
  if [ -r "/proc/$1/cmdline" ]; then
    tr '\0' ' ' <"/proc/$1/cmdline"
  else
    ps -p "$1" -o command= 2>/dev/null
  fi
}

if ! node -e 'const s=require("net").connect(Number(process.argv[1]),"127.0.0.1");s.once("connect",()=>{s.destroy();process.exit(0)});s.once("error",()=>process.exit(1))' "$port"; then
  echo "FAIL: nothing is listening on port $port"
  exit 1
fi

if [ ! -f "$pid_file" ]; then
  echo "FAIL: port $port has a listener but $pid_file does not exist"
  echo "This checkout's serve.sh did not start it. Refuse to drive it; it belongs to someone else."
  exit 1
fi

# Only one process can hold the listen socket, and serve.sh records a pid
# only for a server that answered on this port, so a live recorded pid that
# is still a next-server is the listener.
pid=$(cat "$pid_file")
if ! kill -0 "$pid" 2>/dev/null; then
  echo "FAIL: recorded pid $pid is dead, so the listener on port $port is not the server this checkout started"
  echo "Refuse to drive it; run serve.sh stop $port to clear the stale record."
  exit 1
fi
case "$(pid_command "$pid")" in
  *next-server*) ;;
  *)
    echo "FAIL: recorded pid $pid is no longer a next-server; the pid was likely reused"
    echo "Refuse to drive the listener on port $port; run serve.sh stop $port to clear the stale record."
    exit 1
    ;;
esac

body=$(curl -fsS "http://127.0.0.1:$port/" 2>/dev/null) || {
  echo "FAIL: pid $pid owns port $port but / did not answer 200"
  exit 1
}
case $body in
  *"Memory Chess"*) ;;
  *)
    echo "FAIL: / answered but does not mention Memory Chess"
    exit 1
    ;;
esac

echo "OK: pid $pid serves this checkout at http://127.0.0.1:$port"
