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
CUSTOMER_ROOT_DIR="${CUSTOMER_ROOT_DIR:-/opt/frozenclaw/customers}"
SERVER_TIMEZONE="${SERVER_TIMEZONE:-Europe/Berlin}"
APP_BASE_URL="${APP_BASE_URL:-http://46.225.143.215}"
APP_SYSTEM_USER="${APP_SYSTEM_USER:-frozenclaw}"
APP_SYSTEM_GROUP="${APP_SYSTEM_GROUP:-frozenclaw}"
OPENCLAW_CONTROL_UI_DISABLE_DEVICE_AUTH="${OPENCLAW_CONTROL_UI_DISABLE_DEVICE_AUTH:-true}"
CONTAINER_NAME="frozenclaw-${SLUG}"
CUSTOMER_DIR="${CUSTOMER_ROOT_DIR}/${SLUG}"
CONFIG_DIR="${CUSTOMER_DIR}/config"
WORKSPACE_DIR="${CUSTOMER_DIR}/workspace"
INSTANCE_ENV="${CUSTOMER_DIR}/instance.env"
PROVIDER_ENV="${CONFIG_DIR}/.env"
OPENCLAW_CONFIG_JSON="${CONFIG_DIR}/openclaw.json"
CADDY_SNIPPET="/etc/caddy/customers.d/${SLUG}.caddy"

mkdir -p "$CONFIG_DIR" "$WORKSPACE_DIR" /etc/caddy/customers.d

if ! docker image inspect "$OPENCLAW_IMAGE" >/dev/null 2>&1; then
  /opt/frozenclaw/app/scripts/server/install-openclaw-base.sh
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
EOF

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

cat > "$CADDY_SNIPPET" <<EOF
handle /agent/$SLUG {
	reverse_proxy 127.0.0.1:$PORT
}

handle_path /agent/$SLUG/* {
	reverse_proxy 127.0.0.1:$PORT
}
EOF

chown -R "$APP_SYSTEM_USER:$APP_SYSTEM_GROUP" "$CUSTOMER_DIR"
chmod 750 "$CUSTOMER_DIR" "$CONFIG_DIR" "$WORKSPACE_DIR"
chmod 640 "$INSTANCE_ENV" "$PROVIDER_ENV" "$OPENCLAW_CONFIG_JSON"

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

caddy validate --config /etc/caddy/Caddyfile
systemctl reload caddy

for _ in $(seq 1 30); do
  CODE="$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:${PORT}/healthz" || true)"
  if [[ "$CODE" != "000" ]]; then
    echo "OpenClaw-Instanz $SLUG ist erreichbar."
    exit 0
  fi

  sleep 2
done

echo "OpenClaw-Instanz $SLUG wurde nicht rechtzeitig erreichbar." >&2
docker logs "$CONTAINER_NAME" --tail 200 >&2 || true
exit 1
