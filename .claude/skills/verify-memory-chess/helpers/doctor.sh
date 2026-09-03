#!/usr/bin/env bash
set -euo pipefail

port=${1:-4517}
root=$(git -C "$(dirname "$0")" rev-parse --show-toplevel)

pid=$(lsof -nP -tiTCP:"$port" -sTCP:LISTEN 2>/dev/null | head -1 || true)
if [ -z "$pid" ]; then
  echo "FAIL: nothing is listening on port $port"
  exit 1
fi

cwd=$(lsof -a -p "$pid" -d cwd -Fn 2>/dev/null | sed -n 's/^n//p')
if [ "$cwd" != "$root" ]; then
  echo "FAIL: port $port is owned by pid $pid running in $cwd, not this checkout ($root)"
  echo "Refuse to drive it; it belongs to someone else."
  exit 1
fi

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
