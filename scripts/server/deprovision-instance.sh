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

SLUG=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --slug)
      SLUG="$2"
      shift 2
      ;;
    *)
      echo "Unbekanntes Argument: $1" >&2
      exit 1
      ;;
  esac
done

if [[ -z "$SLUG" ]]; then
  echo "Slug fehlt." >&2
  exit 1
fi

CUSTOMER_ROOT_DIR="${CUSTOMER_ROOT_DIR:-/opt/frozenclaw/customers}"
CUSTOMER_DIR="${CUSTOMER_ROOT_DIR}/${SLUG}"
WEBUI_CONTAINER_NAME="frozenclaw-webui-${SLUG}"
CADDY_SNIPPET="/etc/caddy/customers.d/${SLUG}.caddy"

docker rm -f "frozenclaw-$SLUG" >/dev/null 2>&1 || true
docker rm -f "$WEBUI_CONTAINER_NAME" >/dev/null 2>&1 || true
rm -f "$CADDY_SNIPPET"
rm -rf "${CUSTOMER_DIR:?}"
caddy validate --config /etc/caddy/Caddyfile
systemctl reload caddy
