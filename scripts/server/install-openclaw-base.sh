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

python3 - <<'PY' "$OPENCLAW_REPO_DIR/src/agents/model-selection.ts"
from pathlib import Path
import sys

target = Path(sys.argv[1])
content = target.read_text(encoding="utf-8")
old = """export function resolveAllowedModelRef(params: {\n  cfg: OpenClawConfig;\n  catalog: ModelCatalogEntry[];\n  raw: string;\n  defaultProvider: string;\n  defaultModel?: string;\n}):\n  | { ref: ModelRef; key: string }\n  | {\n      error: string;\n    } {\n  const trimmed = params.raw.trim();\n  if (!trimmed) {\n    return { error: \"invalid model: empty\" };\n  }\n\n  const aliasIndex = buildModelAliasIndex({\n    cfg: params.cfg,\n    defaultProvider: params.defaultProvider,\n  });\n  const resolved = resolveModelRefFromString({\n    raw: trimmed,\n    defaultProvider: params.defaultProvider,\n    aliasIndex,\n  });\n"""
new = """export function resolveAllowedModelRef(params: {\n  cfg: OpenClawConfig;\n  catalog: ModelCatalogEntry[];\n  raw: string;\n  defaultProvider: string;\n  defaultModel?: string;\n}):\n  | { ref: ModelRef; key: string }\n  | {\n      error: string;\n    } {\n  const trimmed = params.raw.trim();\n  if (!trimmed) {\n    return { error: \"invalid model: empty\" };\n  }\n\n  const inferredProvider = !trimmed.includes(\"/\")\n    ? inferUniqueProviderFromConfiguredModels({\n        cfg: params.cfg,\n        model: trimmed,\n      })\n    : undefined;\n\n  const aliasIndex = buildModelAliasIndex({\n    cfg: params.cfg,\n    defaultProvider: inferredProvider ?? params.defaultProvider,\n  });\n  const resolved = resolveModelRefFromString({\n    raw: trimmed,\n    defaultProvider: inferredProvider ?? params.defaultProvider,\n    aliasIndex,\n  });\n"""
patched = content.replace(old, new)

if content != patched:
    target.write_text(patched, encoding="utf-8")
PY

python3 - <<'PY' "$OPENCLAW_REPO_DIR/src/gateway/server.impl.ts"
from pathlib import Path
import sys

target = Path(sys.argv[1])
content = target.read_text(encoding="utf-8")
old = """function createGatewayAuthRateLimiters(rateLimitConfig: AuthRateLimitConfig | undefined): {\n  rateLimiter?: AuthRateLimiter;\n  browserRateLimiter: AuthRateLimiter;\n} {\n  const rateLimiter = rateLimitConfig ? createAuthRateLimiter(rateLimitConfig) : undefined;\n  // Browser-origin WS auth attempts always use loopback-non-exempt throttling.\n  const browserRateLimiter = createAuthRateLimiter({\n    ...rateLimitConfig,\n    exemptLoopback: false,\n  });\n  return { rateLimiter, browserRateLimiter };\n}\n"""
new = """function createGatewayAuthRateLimiters(rateLimitConfig: AuthRateLimitConfig | undefined): {\n  rateLimiter?: AuthRateLimiter;\n  browserRateLimiter: AuthRateLimiter;\n} {\n  const rateLimiter = rateLimitConfig ? createAuthRateLimiter(rateLimitConfig) : undefined;\n  // Frozenclaw proxies the Control UI over loopback via Caddy. When every browser\n  // request appears as 127.0.0.1, loopback throttling locks out all users together.\n  // Keep the shared limiter configurable, but exempt loopback for the browser UI.\n  const browserRateLimiter = createAuthRateLimiter({\n    ...rateLimitConfig,\n    exemptLoopback: true,\n  });\n  return { rateLimiter, browserRateLimiter };\n}\n"""
patched = content.replace(old, new)

if content != patched:
    target.write_text(patched, encoding="utf-8")
PY

python3 - <<'PY' "$OPENCLAW_REPO_DIR/ui/src/ui/storage.ts"
from pathlib import Path
import sys

target = Path(sys.argv[1])
content = target.read_text(encoding="utf-8")

old = """function persistSessionToken(gatewayUrl: string, token: string) {\n  try {\n    const storage = getSessionStorage();\n    if (!storage) {\n      return;\n    }\n    storage.removeItem(LEGACY_TOKEN_SESSION_KEY);\n    const key = tokenSessionKeyForGateway(gatewayUrl);\n    const normalized = token.trim();\n    if (normalized) {\n      storage.setItem(key, normalized);\n      return;\n    }\n    storage.removeItem(key);\n  } catch {\n    // best-effort\n  }\n}\n"""
new = """export function persistSessionToken(gatewayUrl: string, token: string) {\n  try {\n    const storage = getSessionStorage();\n    if (!storage) {\n      return;\n    }\n    storage.removeItem(LEGACY_TOKEN_SESSION_KEY);\n    const key = tokenSessionKeyForGateway(gatewayUrl);\n    const normalized = token.trim();\n    if (normalized) {\n      storage.setItem(key, normalized);\n      return;\n    }\n    storage.removeItem(key);\n  } catch {\n    // best-effort\n  }\n}\n\nexport function clearSessionTokens() {\n  try {\n    const storage = getSessionStorage();\n    if (!storage) {\n      return;\n    }\n    const keys: string[] = [];\n    for (let index = 0; index < storage.length; index += 1) {\n      const key = storage.key(index);\n      if (!key) {\n        continue;\n      }\n      if (key === LEGACY_TOKEN_SESSION_KEY || key.startsWith(TOKEN_SESSION_KEY_PREFIX)) {\n        keys.push(key);\n      }\n    }\n    for (const key of keys) {\n      storage.removeItem(key);\n    }\n  } catch {\n    // best-effort\n  }\n}\n"""
patched = content.replace(old, new)

if content != patched:
    target.write_text(patched, encoding="utf-8")
PY

python3 - <<'PY' "$OPENCLAW_REPO_DIR/ui/src/ui/app-settings.ts"
from pathlib import Path
import sys

target = Path(sys.argv[1])
content = target.read_text(encoding="utf-8")

patched = content.replace(
    'import { saveSettings, type UiSettings } from "./storage.ts";',
    'import { clearSessionTokens, persistSessionToken, saveSettings, type UiSettings } from "./storage.ts";',
)

old = """  if (tokenRaw != null) {\n    const token = tokenRaw.trim();\n    if (token && gatewayUrlChanged) {\n      host.pendingGatewayToken = token;\n    } else if (token && token !== host.settings.token) {\n      applySettings(host, { ...host.settings, token });\n    }\n    hashParams.delete(\"token\");\n    shouldCleanUrl = true;\n  }\n"""
new = """  if (tokenRaw != null) {\n    const token = tokenRaw.trim();\n    if (token) {\n      clearSessionTokens();\n      persistSessionToken(nextGatewayUrl || host.settings.gatewayUrl, token);\n    }\n    if (token && gatewayUrlChanged) {\n      host.pendingGatewayToken = token;\n    } else if (token) {\n      applySettings(host, { ...host.settings, token });\n    }\n    hashParams.delete(\"token\");\n    shouldCleanUrl = true;\n  }\n"""
patched = patched.replace(old, new)

if content != patched:
    target.write_text(patched, encoding="utf-8")
PY

DOCKER_BUILDKIT=1 docker build -t "$OPENCLAW_IMAGE" "$OPENCLAW_REPO_DIR"
