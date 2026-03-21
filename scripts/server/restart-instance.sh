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

docker restart "frozenclaw-$SLUG" >/dev/null
