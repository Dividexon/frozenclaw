#!/usr/bin/env bash
set -euo pipefail

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
CADDY_SNIPPET="/etc/caddy/customers.d/${SLUG}.caddy"

docker rm -f "frozenclaw-$SLUG" >/dev/null 2>&1 || true
rm -f "$CADDY_SNIPPET"
rm -rf "${CUSTOMER_ROOT_DIR:?}/${SLUG}"
caddy validate --config /etc/caddy/Caddyfile
systemctl reload caddy
