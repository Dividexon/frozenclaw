#!/usr/bin/env bash
set -euo pipefail

OPENCLAW_REPO_DIR="${OPENCLAW_REPO_DIR:-/opt/frozenclaw/vendor/openclaw}"
OPENCLAW_IMAGE="${OPENCLAW_IMAGE:-frozenclaw/openclaw:latest}"
OPENCLAW_GIT_REF="${OPENCLAW_GIT_REF:-main}"

mkdir -p "$(dirname "$OPENCLAW_REPO_DIR")"

if [[ ! -d "$OPENCLAW_REPO_DIR/.git" ]]; then
  git clone --depth 1 --branch "$OPENCLAW_GIT_REF" https://github.com/openclaw/openclaw.git "$OPENCLAW_REPO_DIR"
else
  git -C "$OPENCLAW_REPO_DIR" fetch --depth 1 origin "$OPENCLAW_GIT_REF"
  git -C "$OPENCLAW_REPO_DIR" checkout "$OPENCLAW_GIT_REF"
  git -C "$OPENCLAW_REPO_DIR" reset --hard "origin/$OPENCLAW_GIT_REF"
fi

docker build -t "$OPENCLAW_IMAGE" "$OPENCLAW_REPO_DIR"
