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

python3 - <<'PY' "$OPENCLAW_REPO_DIR/ui/src/ui/chat/speech.ts"
from pathlib import Path
import sys

target = Path(sys.argv[1])
content = target.read_text(encoding="utf-8")
marker = "export function isTtsSupported(): boolean {"
tail = "\n\n/** Strip common markdown syntax for cleaner speech output. */"
start = content.find(marker)
end = content.find(tail, start)

if start == -1 or end == -1:
    raise SystemExit("speech.ts TTS block not found")

block_start = content.rfind("//", 0, start)
if block_start == -1:
    block_start = start

new = """// TTS (Text-to-Speech)\n\nconst TOKEN_SESSION_KEY_PREFIX = \"openclaw.control.token.v1:\";\n\nexport function isTtsSupported(): boolean {\n  return true;\n}\n\nlet currentUtterance: SpeechSynthesisUtterance | null = null;\nlet currentAudio: HTMLAudioElement | null = null;\nlet currentAudioUrl: string | null = null;\n\nfunction deriveInstanceSlug(): string {\n  const match = window.location.pathname.match(/\\/agent\\/([^/]+)/);\n  return match?.[1]?.trim() ?? \"\";\n}\n\nfunction deriveGatewayUrl(slug: string): string {\n  const proto = window.location.protocol === \"https:\" ? \"wss\" : \"ws\";\n  return `${proto}://${window.location.host}/agent/${slug}`;\n}\n\nfunction loadGatewayToken(slug: string): string {\n  try {\n    const storage = window.sessionStorage;\n    const directKey = `${TOKEN_SESSION_KEY_PREFIX}${deriveGatewayUrl(slug)}`;\n    const direct = storage.getItem(directKey)?.trim();\n    if (direct) {\n      return direct;\n    }\n    for (let index = 0; index < storage.length; index += 1) {\n      const key = storage.key(index);\n      if (!key?.startsWith(TOKEN_SESSION_KEY_PREFIX)) {\n        continue;\n      }\n      const value = storage.getItem(key)?.trim();\n      if (value) {\n        return value;\n      }\n    }\n  } catch {\n    // best-effort\n  }\n  return \"\";\n}\n\nfunction fallbackSpeakText(\n  text: string,\n  opts?: {\n    onStart?: () => void;\n    onEnd?: () => void;\n    onError?: (error: string) => void;\n  },\n): boolean {\n  if (!(\"speechSynthesis\" in globalThis)) {\n    opts?.onError?.(\"Speech synthesis is not supported in this browser\");\n    return false;\n  }\n\n  const utterance = new SpeechSynthesisUtterance(text);\n  utterance.lang = \"de-DE\";\n  utterance.rate = 1.0;\n  utterance.pitch = 1.0;\n\n  const voices = typeof speechSynthesis.getVoices === \"function\" ? speechSynthesis.getVoices() : [];\n  const germanVoice = voices.find((voice) => voice.lang?.toLowerCase().startsWith(\"de\"));\n  if (germanVoice) {\n    utterance.voice = germanVoice;\n    utterance.lang = germanVoice.lang || \"de-DE\";\n  }\n\n  utterance.addEventListener(\"start\", () => opts?.onStart?.());\n  utterance.addEventListener(\"end\", () => {\n    if (currentUtterance === utterance) {\n      currentUtterance = null;\n    }\n    opts?.onEnd?.();\n  });\n  utterance.addEventListener(\"error\", (e) => {\n    if (currentUtterance === utterance) {\n      currentUtterance = null;\n    }\n    if (e.error === \"canceled\" || e.error === \"interrupted\") {\n      return;\n    }\n    opts?.onError?.(e.error);\n  });\n\n  currentUtterance = utterance;\n  speechSynthesis.speak(utterance);\n  return true;\n}\n\nexport function speakText(\n  text: string,\n  opts?: {\n    onStart?: () => void;\n    onEnd?: () => void;\n    onError?: (error: string) => void;\n  },\n): boolean {\n  stopTts();\n\n  const cleaned = stripMarkdown(text);\n  if (!cleaned.trim()) {\n    return false;\n  }\n\n  const slug = deriveInstanceSlug();\n  const token = slug ? loadGatewayToken(slug) : \"\";\n\n  if (!slug || !token) {\n    return fallbackSpeakText(cleaned, opts);\n  }\n\n  const audio = new Audio();\n\n  audio.addEventListener(\"play\", () => opts?.onStart?.(), { once: true });\n  audio.addEventListener(\n    \"ended\",\n    () => {\n      if (currentAudio === audio) {\n        currentAudio = null;\n      }\n      if (currentAudioUrl) {\n        URL.revokeObjectURL(currentAudioUrl);\n        currentAudioUrl = null;\n      }\n      opts?.onEnd?.();\n    },\n    { once: true },\n  );\n  audio.addEventListener(\n    \"error\",\n    () => {\n      if (currentAudio === audio) {\n        currentAudio = null;\n      }\n      if (currentAudioUrl) {\n        URL.revokeObjectURL(currentAudioUrl);\n        currentAudioUrl = null;\n      }\n      fallbackSpeakText(cleaned, opts);\n    },\n    { once: true },\n  );\n\n  currentAudio = audio;\n\n  void fetch(\"/api/tts\", {\n    method: \"POST\",\n    headers: {\n      \"Content-Type\": \"application/json\",\n      Authorization: `Bearer ${token}`,\n    },\n    body: JSON.stringify({ slug, text: cleaned }),\n  })\n    .then(async (response) => {\n      if (!response.ok) {\n        throw new Error(`tts_http_${response.status}`);\n      }\n      const blob = await response.blob();\n      const url = URL.createObjectURL(blob);\n      currentAudioUrl = url;\n      audio.src = url;\n      await audio.play();\n    })\n    .catch(() => {\n      if (currentAudio === audio) {\n        currentAudio = null;\n      }\n      if (currentAudioUrl) {\n        URL.revokeObjectURL(currentAudioUrl);\n        currentAudioUrl = null;\n      }\n      fallbackSpeakText(cleaned, opts);\n    });\n\n  return true;\n}\n\nexport function stopTts(): void {\n  if (currentUtterance) {\n    speechSynthesis.cancel();\n    currentUtterance = null;\n  }\n  if (currentAudio) {\n    currentAudio.pause();\n    currentAudio.currentTime = 0;\n    currentAudio = null;\n  }\n  if (currentAudioUrl) {\n    URL.revokeObjectURL(currentAudioUrl);\n    currentAudioUrl = null;\n  }\n}\n\nexport function isTtsSpeaking(): boolean {\n  return Boolean(currentAudio && !currentAudio.paused) || (\"speechSynthesis\" in globalThis && speechSynthesis.speaking);\n}\n"""
patched = content[:block_start] + new + content[end:]

if content != patched:
    target.write_text(patched, encoding="utf-8")
PY

DOCKER_BUILDKIT=1 docker build -t "$OPENCLAW_IMAGE" "$OPENCLAW_REPO_DIR"
