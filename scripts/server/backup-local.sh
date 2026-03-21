#!/usr/bin/env bash
set -euo pipefail

BACKUP_ROOT="/opt/frozenclaw/data/backups"
STAMP="$(date -u +%Y%m%d-%H%M%S)"
TARGET_DIR="$BACKUP_ROOT/$STAMP"

mkdir -p "$TARGET_DIR"

if [[ -f /opt/frozenclaw/data/frozenclaw.db ]]; then
  sqlite3 /opt/frozenclaw/data/frozenclaw.db ".backup '$TARGET_DIR/frozenclaw.db'"
fi

if [[ -d /opt/frozenclaw/customers ]]; then
  tar -czf "$TARGET_DIR/customers.tar.gz" -C /opt/frozenclaw customers
fi

if [[ -f /etc/frozenclaw/frozenclaw.env ]]; then
  install -m 600 /etc/frozenclaw/frozenclaw.env "$TARGET_DIR/frozenclaw.env"
fi

find "$BACKUP_ROOT" -mindepth 1 -maxdepth 1 -type d | sort | head -n -7 | xargs -r rm -rf
echo "Lokales Backup erstellt: $TARGET_DIR"
