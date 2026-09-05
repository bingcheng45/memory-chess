#!/usr/bin/env bash
set -euo pipefail

port=${1:-4517}
root=$(git -C "$(dirname "$0")" rev-parse --show-toplevel)
pid_file=$root/.verify/server-$port.pid

pid_start_time() {
  # Minimal Linux images ship no ps, and macOS has no /proc. The sed strips
  # the comm field, whose own parentheses break naive field counting.
  if [ -r "/proc/$1/stat" ]; then
    sed 's/^.*) //' "/proc/$1/stat" | awk '{print $20}'
  else
    ps -p "$1" -o lstart= 2>/dev/null
  fi
}

rc=0
body=$(curl -fsS "http://127.0.0.1:$port/" 2>/dev/null) || rc=$?
if [ "$rc" -eq 7 ]; then
  echo "FAIL: nothing is listening on port $port"
  exit 1
elif [ "$rc" -ne 0 ]; then
  echo "FAIL: port $port has a listener but / did not answer 200"
  exit 1
fi

if [ ! -f "$pid_file" ]; then
  echo "FAIL: port $port answers but $pid_file does not exist"
  echo "This checkout's serve.sh did not start it. Refuse to drive it; it belongs to someone else."
  exit 1
fi

# Only one process can hold the listen socket, and serve.sh records a server
# only once it answered on this port, so a record matching the live process
# instance means the listener is ours.
pid=$(sed -n 1p "$pid_file")
recorded_start=$(sed -n 2p "$pid_file")
if ! kill -0 "$pid" 2>/dev/null; then
  echo "FAIL: recorded pid $pid is dead, so the listener on port $port is not the server this checkout started"
  echo "Refuse to drive it; run serve.sh stop $port to clear the stale record."
  exit 1
fi
if [ -z "$recorded_start" ] || [ "$(pid_start_time "$pid" || true)" != "$recorded_start" ]; then
  echo "FAIL: pid $pid is not the process serve.sh started; the pid was reused after that server died"
  echo "Refuse to drive the listener on port $port; run serve.sh stop $port to clear the stale record."
  exit 1
fi

case $body in
  *"Memory Chess"*) ;;
  *)
    echo "FAIL: / answered but does not mention Memory Chess"
    exit 1
    ;;
esac

echo "OK: pid $pid serves this checkout at http://127.0.0.1:$port"
