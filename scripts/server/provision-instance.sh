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

ORDER_ID=""
SLUG=""
PORT=""
TOKEN=""
USAGE_MODE="byok"
MANAGED_PROVIDER=""
MANAGED_MODEL=""
MANAGED_TRACKING_TOKEN=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --order-id)
      ORDER_ID="$2"
      shift 2
      ;;
    --slug)
      SLUG="$2"
      shift 2
      ;;
    --port)
      PORT="$2"
      shift 2
      ;;
    --token)
      TOKEN="$2"
      shift 2
      ;;
    --usage-mode)
      USAGE_MODE="$2"
      shift 2
      ;;
    --managed-provider)
      MANAGED_PROVIDER="$2"
      shift 2
      ;;
    --managed-model)
      MANAGED_MODEL="$2"
      shift 2
      ;;
    --managed-tracking-token)
      MANAGED_TRACKING_TOKEN="$2"
      shift 2
      ;;
    *)
      echo "Unbekanntes Argument: $1" >&2
      exit 1
      ;;
  esac
done

if [[ -z "$ORDER_ID" || -z "$SLUG" || -z "$PORT" || -z "$TOKEN" ]]; then
  echo "Es fehlen Pflichtargumente." >&2
  exit 1
fi

OPENCLAW_IMAGE="${OPENCLAW_IMAGE:-frozenclaw/openclaw:latest}"
OPENWEBUI_IMAGE="${OPENWEBUI_IMAGE:-ghcr.io/open-webui/open-webui:main}"
CUSTOMER_ROOT_DIR="${CUSTOMER_ROOT_DIR:-/opt/frozenclaw/customers}"
SERVER_TIMEZONE="${SERVER_TIMEZONE:-Europe/Berlin}"
APP_BASE_URL="${APP_BASE_URL:-http://46.225.143.215}"
APP_SYSTEM_USER="${APP_SYSTEM_USER:-frozenclaw}"
APP_SYSTEM_GROUP="${APP_SYSTEM_GROUP:-frozenclaw}"
OPENCLAW_CONTROL_UI_DISABLE_DEVICE_AUTH="${OPENCLAW_CONTROL_UI_DISABLE_DEVICE_AUTH:-true}"
CONTAINER_NAME="frozenclaw-${SLUG}"
WEBUI_PORT=$((PORT + 1))
WEBUI_CONTAINER_NAME="frozenclaw-webui-${SLUG}"
CUSTOMER_DIR="${CUSTOMER_ROOT_DIR}/${SLUG}"
CONFIG_DIR="${CUSTOMER_DIR}/config"
WORKSPACE_DIR="${CUSTOMER_DIR}/workspace"
WEBUI_DATA_DIR="${CUSTOMER_DIR}/webui"
AGENT_DIR="${CONFIG_DIR}/agents/main/agent"
SESSIONS_DIR="${CONFIG_DIR}/agents/main/sessions"
INSTANCE_ENV="${CUSTOMER_DIR}/instance.env"
PROVIDER_ENV="${CONFIG_DIR}/.env"
OPENCLAW_CONFIG_JSON="${CONFIG_DIR}/openclaw.json"
AUTH_PROFILES_JSON="${AGENT_DIR}/auth-profiles.json"
MANAGED_PLUGIN_DIR="${WORKSPACE_DIR}/.openclaw/extensions/frozenclaw-managed-usage"
MANAGED_PLUGIN_FILE="${MANAGED_PLUGIN_DIR}/index.cjs"
MANAGED_PLUGIN_MANIFEST="${MANAGED_PLUGIN_DIR}/openclaw.plugin.json"
CADDY_SNIPPET="/etc/caddy/customers.d/${SLUG}.caddy"
OPENAI_MANAGED_API_KEY="${OPENAI_MANAGED_API_KEY:-}"
MANAGED_MODEL_ALIAS="${MANAGED_MODEL#*/}"

mkdir -p "$CONFIG_DIR" "$WORKSPACE_DIR" "$AGENT_DIR" "$WEBUI_DATA_DIR" /etc/caddy/customers.d

if ! docker image inspect "$OPENCLAW_IMAGE" >/dev/null 2>&1; then
  /opt/frozenclaw/app/scripts/server/install-openclaw-base.sh
fi

/opt/frozenclaw/app/scripts/server/write-workspace-files.sh "$WORKSPACE_DIR"

if [[ "$USAGE_MODE" == "managed" && -f "$SESSIONS_DIR/sessions.json" ]]; then
  if grep -Eq '"modelProvider": "(anthropic|google)"|"model": "claude-|"model": "gemini-' "$SESSIONS_DIR/sessions.json"; then
    mv "$SESSIONS_DIR" "${SESSIONS_DIR}.reset.$(date +%Y%m%d%H%M%S)"
    mkdir -p "$SESSIONS_DIR"
  fi
fi

if [[ ! -f "$PROVIDER_ENV" ]]; then
  cat > "$PROVIDER_ENV" <<EOF
OPENCLAW_GATEWAY_TOKEN=$TOKEN
EOF
else
  grep -q '^OPENCLAW_GATEWAY_TOKEN=' "$PROVIDER_ENV" \
    && sed -i "s/^OPENCLAW_GATEWAY_TOKEN=.*/OPENCLAW_GATEWAY_TOKEN=$TOKEN/" "$PROVIDER_ENV" \
    || printf '\nOPENCLAW_GATEWAY_TOKEN=%s\n' "$TOKEN" >> "$PROVIDER_ENV"
fi

cat > "$INSTANCE_ENV" <<EOF
ORDER_ID=$ORDER_ID
INSTANCE_SLUG=$SLUG
INSTANCE_PORT=$PORT
GATEWAY_TOKEN=$TOKEN
CONTAINER_NAME=$CONTAINER_NAME
OPENCLAW_IMAGE=$OPENCLAW_IMAGE
OPENWEBUI_IMAGE=$OPENWEBUI_IMAGE
USAGE_MODE=$USAGE_MODE
MANAGED_PROVIDER=$MANAGED_PROVIDER
MANAGED_MODEL=$MANAGED_MODEL
MANAGED_TRACKING_TOKEN=$MANAGED_TRACKING_TOKEN
EOF

if [[ "$USAGE_MODE" == "managed" ]]; then
  mkdir -p "$MANAGED_PLUGIN_DIR"
  sed -i '/^ANTHROPIC_API_KEY=/d;/^OPENAI_API_KEY=/d;/^GEMINI_API_KEY=/d' "$PROVIDER_ENV"

  if [[ -n "$OPENAI_MANAGED_API_KEY" && -n "$MANAGED_MODEL" ]]; then
    printf 'OPENAI_API_KEY=%s\n' "$OPENAI_MANAGED_API_KEY" >> "$PROVIDER_ENV"

    cat > "$AUTH_PROFILES_JSON" <<EOF
{
  "version": 1,
  "profiles": {
    "openai:default": {
      "type": "api_key",
      "provider": "openai",
      "key": "$OPENAI_MANAGED_API_KEY"
    }
  },
  "order": {
    "openai": ["openai:default"]
  }
}
EOF
  else
    cat > "$AUTH_PROFILES_JSON" <<EOF
{
  "version": 1,
  "profiles": {}
}
EOF
  fi

  if [[ -n "$MANAGED_MODEL" && -n "$MANAGED_TRACKING_TOKEN" ]]; then
    cat > "$MANAGED_PLUGIN_FILE" <<EOF
module.exports = {
  id: "frozenclaw-managed-usage",
  register(api) {
    api.on("llm_output", async (event) => {
      if (!event || event.provider !== "openai" || !event.usage) {
        return;
      }

      try {
        await fetch("${APP_BASE_URL}/api/internal/managed-usage", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer ${MANAGED_TRACKING_TOKEN}"
          },
          body: JSON.stringify({
            slug: "${SLUG}",
            usageKey: event.runId,
            provider: event.provider,
            model: event.model,
            source: "llm_output",
            usage: {
              input: event.usage.input ?? 0,
              output: event.usage.output ?? 0,
              total: event.usage.total ?? ((event.usage.input ?? 0) + (event.usage.output ?? 0))
            }
          })
        });
      } catch {
        // Usage logging must never break the agent run.
      }
    });
  }
};
EOF

    cat > "$MANAGED_PLUGIN_MANIFEST" <<EOF
{
  "id": "frozenclaw-managed-usage",
  "name": "Frozenclaw Managed Usage",
  "version": "1.0.0",
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {}
  }
}
EOF
  else
    rm -f "$MANAGED_PLUGIN_FILE" "$MANAGED_PLUGIN_MANIFEST"
  fi
else
  if [[ ! -f "$AUTH_PROFILES_JSON" ]]; then
    cat > "$AUTH_PROFILES_JSON" <<EOF
{
  "version": 1,
  "profiles": {}
}
EOF
  fi
  rm -f "$MANAGED_PLUGIN_FILE" "$MANAGED_PLUGIN_MANIFEST"
fi

if [[ "$USAGE_MODE" == "managed" && -n "$MANAGED_MODEL" ]]; then
  cat > "$OPENCLAW_CONFIG_JSON" <<EOF
{
  "gateway": {
    "controlUi": {
      "allowedOrigins": ["$APP_BASE_URL"],
      "dangerouslyDisableDeviceAuth": $OPENCLAW_CONTROL_UI_DISABLE_DEVICE_AUTH
    }
  },
  "agents": {
    "defaults": {
      "model": {
        "primary": "$MANAGED_MODEL"
      },
      "models": {
        "$MANAGED_MODEL": {
          "alias": "$MANAGED_MODEL_ALIAS"
        }
      }
    }
  },
  "plugins": {
    "enabled": true,
    "allow": ["frozenclaw-managed-usage"]
  }
}
EOF
else
  cat > "$OPENCLAW_CONFIG_JSON" <<EOF
{
  "gateway": {
    "controlUi": {
      "allowedOrigins": ["$APP_BASE_URL"],
      "dangerouslyDisableDeviceAuth": $OPENCLAW_CONTROL_UI_DISABLE_DEVICE_AUTH
    }
  }
}
EOF
fi

cat > "$CADDY_SNIPPET" <<EOF
handle /agent/$SLUG {
	reverse_proxy 127.0.0.1:$WEBUI_PORT
}

handle_path /agent/$SLUG/* {
	reverse_proxy 127.0.0.1:$WEBUI_PORT
}
EOF

chown -R "$APP_SYSTEM_USER:$APP_SYSTEM_GROUP" "$CUSTOMER_DIR"
chmod 750 "$CUSTOMER_DIR" "$CONFIG_DIR" "$WORKSPACE_DIR" "${CONFIG_DIR}/agents" "${CONFIG_DIR}/agents/main" "$AGENT_DIR"
chmod 640 "$INSTANCE_ENV" "$PROVIDER_ENV" "$OPENCLAW_CONFIG_JSON" "$AUTH_PROFILES_JSON"
chown "$APP_SYSTEM_USER:$APP_SYSTEM_GROUP" "$WEBUI_DATA_DIR"
chmod 750 "$WEBUI_DATA_DIR"
if [[ -f "$MANAGED_PLUGIN_FILE" ]]; then
  chown "$APP_SYSTEM_USER:$APP_SYSTEM_GROUP" "$WORKSPACE_DIR"
  chmod 750 "$WORKSPACE_DIR"
  chown root:root "${WORKSPACE_DIR}/.openclaw" "${WORKSPACE_DIR}/.openclaw/extensions" "$MANAGED_PLUGIN_DIR" "$MANAGED_PLUGIN_FILE" "$MANAGED_PLUGIN_MANIFEST"
  chmod 755 "${WORKSPACE_DIR}/.openclaw" "${WORKSPACE_DIR}/.openclaw/extensions" "$MANAGED_PLUGIN_DIR"
  chmod 640 "$MANAGED_PLUGIN_FILE"
  chmod 644 "$MANAGED_PLUGIN_MANIFEST"
fi

docker rm -f "$CONTAINER_NAME" >/dev/null 2>&1 || true

docker run -d \
  --name "$CONTAINER_NAME" \
  --restart unless-stopped \
  --user "0:0" \
  -p "127.0.0.1:${PORT}:18789" \
  -e HOME=/home/node \
  -e TERM=xterm-256color \
  -e TZ="$SERVER_TIMEZONE" \
  -v "$CONFIG_DIR:/home/node/.openclaw" \
  -v "$WORKSPACE_DIR:/home/node/.openclaw/workspace" \
  "$OPENCLAW_IMAGE" \
  node dist/index.js gateway --bind lan --port 18789 --allow-unconfigured

docker rm -f "$WEBUI_CONTAINER_NAME" >/dev/null 2>&1 || true

docker run -d \
  --name "$WEBUI_CONTAINER_NAME" \
  --restart unless-stopped \
  --add-host=host.docker.internal:host-gateway \
  -p "127.0.0.1:${WEBUI_PORT}:8080" \
  -e OPENAI_API_BASE_URL="http://host.docker.internal:${PORT}/v1" \
  -e OPENAI_API_KEY="${TOKEN}" \
  -e WEBUI_AUTH=False \
  -e ENABLE_PERSISTENT_CONFIG=False \
  -e WEBUI_NAME="Frozenclaw" \
  -e WEBUI_FAVICON_URL="${APP_BASE_URL}/favicon.ico" \
  -e WEBUI_SECRET_KEY="$(openssl rand -hex 32)" \
  -e DEFAULT_MODELS="" \
  -e ENABLE_SIGNUP=False \
  -v "${WEBUI_DATA_DIR}:/app/backend/data" \
  "$OPENWEBUI_IMAGE"

caddy validate --config /etc/caddy/Caddyfile
systemctl reload caddy

CODE="000"
for _ in $(seq 1 30); do
  CODE="$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:${PORT}/healthz" || true)"
  if [[ "$CODE" != "000" ]]; then
    echo "OpenClaw-Instanz $SLUG ist erreichbar."
    break
  fi

  sleep 2
done

if [[ "$CODE" == "000" ]]; then
  echo "OpenClaw-Instanz $SLUG wurde nicht rechtzeitig erreichbar." >&2
  docker logs "$CONTAINER_NAME" --tail 200 >&2 || true
  exit 1
fi

CODE="000"
for _ in $(seq 1 40); do
  CODE="$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:${WEBUI_PORT}/health" || true)"
  if [[ "$CODE" == "200" ]]; then
    echo "OpenWebUI-Instanz $SLUG ist erreichbar."
    exit 0
  fi

  sleep 3
done

echo "OpenWebUI-Instanz $SLUG wurde nicht rechtzeitig erreichbar." >&2
docker logs "$WEBUI_CONTAINER_NAME" --tail 200 >&2 || true
exit 1
