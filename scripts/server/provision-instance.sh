#!/usr/bin/env bash
set -euo pipefail

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

CUSTOMER_DIR="/opt/frozenclaw/customers/$SLUG"
mkdir -p "$CUSTOMER_DIR"

cat > "$CUSTOMER_DIR/instance.env" <<EOF
ORDER_ID=$ORDER_ID
INSTANCE_SLUG=$SLUG
INSTANCE_PORT=$PORT
GATEWAY_TOKEN=$TOKEN
EOF

echo "Provisionierungsplatzhalter für $SLUG erstellt."
