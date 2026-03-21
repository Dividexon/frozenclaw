#!/usr/bin/env bash
set -euo pipefail

if [[ -f /etc/frozenclaw/frozenclaw.env ]]; then
  while IFS= read -r line || [[ -n "$line" ]]; do
    [[ -z "$line" || "${line:0:1}" == "#" || "$line" != *=* ]] && continue
    key="${line%%=*}"
    value="${line#*=}"
    export "$key=$value"
  done < /etc/frozenclaw/frozenclaw.env
fi

OPENCLAW_REPO_DIR="${OPENCLAW_REPO_DIR:-/opt/frozenclaw/vendor/openclaw}"
OPENCLAW_IMAGE="${OPENCLAW_IMAGE:-frozenclaw/openclaw:latest}"
OPENCLAW_GIT_REF="${OPENCLAW_GIT_REF:-main}"

mkdir -p "$(dirname "$OPENCLAW_REPO_DIR")"

if [[ ! -d "$OPENCLAW_REPO_DIR/.git" ]]; then
  git clone --depth 1 --branch "$OPENCLAW_GIT_REF" https://github.com/openclaw/openclaw.git "$OPENCLAW_REPO_DIR"
else
  git -C "$OPENCLAW_REPO_DIR" fetch --depth 1 origin "$OPENCLAW_GIT_REF" || true
  git -C "$OPENCLAW_REPO_DIR" fetch --tags --depth 1 origin

  if git -C "$OPENCLAW_REPO_DIR" rev-parse -q --verify "refs/tags/$OPENCLAW_GIT_REF" >/dev/null; then
    git -C "$OPENCLAW_REPO_DIR" checkout -f "refs/tags/$OPENCLAW_GIT_REF"
  else
    git -C "$OPENCLAW_REPO_DIR" checkout "$OPENCLAW_GIT_REF"
    git -C "$OPENCLAW_REPO_DIR" reset --hard "origin/$OPENCLAW_GIT_REF"
  fi
fi

python3 - <<'PY' "$OPENCLAW_REPO_DIR/src/auto-reply/reply/agent-runner-execution.ts"
from pathlib import Path
import sys

target = Path(sys.argv[1])
content = target.read_text(encoding="utf-8")
patched = content.replace("\u26a0\ufe0f Agent failed before reply:", "Agent failed before reply:")

if content != patched:
    target.write_text(patched, encoding="utf-8")
PY

DOCKER_BUILDKIT=1 docker build -t "$OPENCLAW_IMAGE" "$OPENCLAW_REPO_DIR"
