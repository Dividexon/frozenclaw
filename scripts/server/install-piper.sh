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

PIPER_ROOT="${PIPER_ROOT:-/opt/frozenclaw/piper}"
PIPER_VENV="${PIPER_VENV:-/opt/frozenclaw/piper-venv}"
PIPER_VOICE="${PIPER_VOICE:-de_DE-thorsten-medium}"
PIPER_VOICE_URL_BASE="${PIPER_VOICE_URL_BASE:-https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/de/de_DE/thorsten/medium}"
PIPER_MODEL_PATH="${PIPER_MODEL_PATH:-$PIPER_ROOT/voices/${PIPER_VOICE}.onnx}"
PIPER_CONFIG_PATH="${PIPER_CONFIG_PATH:-$PIPER_ROOT/voices/${PIPER_VOICE}.onnx.json}"

apt-get update
apt-get install -y python3.12-venv curl

python3 -m venv "$PIPER_VENV"
source "$PIPER_VENV/bin/activate"
python -m pip install -U pip
python -m pip install piper-tts pathvalidate

mkdir -p "$(dirname "$PIPER_MODEL_PATH")"
curl -fL "${PIPER_VOICE_URL_BASE}/${PIPER_VOICE}.onnx?download=true" -o "$PIPER_MODEL_PATH"
curl -fL "${PIPER_VOICE_URL_BASE}/${PIPER_VOICE}.onnx.json?download=true" -o "$PIPER_CONFIG_PATH"

echo "Piper bereit:"
echo "  Command: $PIPER_VENV/bin/piper"
echo "  Model:   $PIPER_MODEL_PATH"
echo "  Config:  $PIPER_CONFIG_PATH"
