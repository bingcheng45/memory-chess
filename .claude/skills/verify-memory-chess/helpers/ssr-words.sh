#!/usr/bin/env bash
set -euo pipefail

url=${1:?usage: ssr-words.sh <url> [min-words]}
min=${2:-0}

text=$(curl -fsS "$url" | node -e '
let html = "";
process.stdin.on("data", (c) => (html += c));
process.stdin.on("end", () => {
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&[a-zA-Z#0-9]+;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  console.log(text);
});
')
words=$(printf '%s' "$text" | wc -w | tr -d ' ')
echo "words=$words"
printf '%s\n' "$text"
if [ "$words" -lt "$min" ]; then
  echo "FAIL: $words words is below the floor of $min" >&2
  exit 1
fi
