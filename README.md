# Frozenclaw

Frozenclaw ist eine Landing Page plus Beta-Checkout für gehostete OpenClaw-Instanzen. Der aktuelle Fokus liegt auf `Hosted BYOK`: Der Kunde bringt seinen eigenen Modell-Key mit, Frozenclaw übernimmt Hosting, Bereitstellung und den technischen Betrieb.

## Technischer Stand

- Next.js App Router
- Stripe Checkout und Webhook-Persistenz
- SQLite als Source of Truth
- asynchrone Provisionierung mit Recovery für hängende Jobs
- `mock`-Provisionierung für lokale Tests
- Platzhalterseiten für Impressum, Datenschutz und Beta-Bedingungen
- vorbereiteter Managed-Unterbau für `GPT-5.2`

## Lokale Einrichtung

1. `.env.example` nach `.env.local` kopieren
2. Stripe-Testwerte eintragen
3. Abhängigkeiten installieren
4. Entwicklungsserver starten

```bash
npm install
npm run dev
```

## Wichtige Umgebungsvariablen

- `NEXT_PUBLIC_URL`: öffentliche Basis-URL für Frontend und Success-Seite
- `APP_BASE_URL`: Basis-URL für erzeugte Instanz-Links
- `STRIPE_SECRET_KEY`: Stripe Secret Key
- `STRIPE_WEBHOOK_SECRET`: Webhook Secret
- `PROVISIONING_MODE`: `mock` oder `script`
- `PROVISIONING_USE_SUDO`: setzt Skriptaufrufe auf `sudo -n`, sinnvoll auf dem Server
- `PROVISIONING_SCRIPT`: Skriptpfad für echte Provisionierung im `script`-Modus
- `PROVISIONING_PORT_START`: Start des Portbereichs
- `PROVISIONING_PORT_END`: Ende des Portbereichs
- `PROVISIONING_STALE_MINUTES`: ab wann hängende Provisionierungen erneut angefasst werden
- `AGENT_BASE_PATH`: öffentlicher Pfad vor dem Instanz-Slug, standardmäßig `/agent`
- `APP_SYSTEM_USER` und `APP_SYSTEM_GROUP`: Besitzer der kundenbezogenen Konfigurationsdateien auf dem Host
- `OPENCLAW_CONTROL_UI_DISABLE_DEVICE_AUTH`: setzt für die Browser-Control-UI den OpenClaw-Break-Glass-Modus
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`: SMTP-Zugang für Transaktionsmails
- `MAIL_FROM`: sichtbarer Absender, bei Gmail am besten dieselbe Adresse wie `SMTP_USER`
- `SUPPORT_EMAIL`: Reply-To für Rückfragen
- `OPENAI_MANAGED_API_KEY`: zentraler Betreiber-Key für den späteren Managed-Beta-Pfad
- `PIPER_ENABLED`: aktiviert serverseitige TTS über Piper
- `PIPER_COMMAND`: Pfad zur Piper-CLI, z. B. `/opt/frozenclaw/piper-venv/bin/piper`
- `PIPER_MODEL_PATH`: Pfad zur installierten Voice-Datei `.onnx`
- `PIPER_CONFIG_PATH`: Pfad zur Voice-Konfiguration `.onnx.json`
- `PIPER_MAX_TEXT_LENGTH`: maximale Zeichenzahl pro TTS-Request
- `PIPER_TIMEOUT_MS`: Timeout für einen TTS-Lauf

## Provisionierungsmodi

### `mock`

Standard für lokale Entwicklung. Nach erfolgreichem Webhook wird eine lokale Instanzbeschreibung unter `data/customers/<slug>/instance.json` angelegt und der Auftrag auf `ready` gesetzt.

### `script`

Für echte Server-Provisionierung. Frozenclaw ruft ein externes Skript mit diesen Argumenten auf:

```text
--order-id <id>
--slug <slug>
--port <port>
--token <gateway_token>
```

Das Skript muss Container, Reverse Proxy und Health Check selbst umsetzen. Bei Fehlern wird der Auftrag auf `failed` gesetzt.

Auf einem Linux-Host sollte die Web-App selbst weiterhin als unprivilegierter Nutzer laufen. Für Docker- und Caddy-Zugriffe wird deshalb `PROVISIONING_USE_SUDO=true` plus eine passende `sudoers`-Whitelist empfohlen; ein Template liegt unter [ops/frozenclaw-provisioning.sudoers](/C:/Users/Mariu/clawd/apps/frozenclaw/ops/frozenclaw-provisioning.sudoers).

## Statusfluss

1. `POST /api/checkout` erstellt eine Stripe-Session und speichert den Auftrag
2. `POST /api/webhook/stripe` schreibt die Bezahlung idempotent in SQLite
3. der Auftrag wird asynchron provisioniert
4. `/success?session_id=...` pollt den Status, bis die Instanz bereit oder fehlgeschlagen ist
5. beim App-Start werden `pending`- und veraltete `provisioning`-Aufträge erneut eingeplant

## Mailversand

Frozenclaw kann nach erfolgreicher Bereitstellung und bei fehlgeschlagener Provisionierung automatisch E-Mails versenden. Für Gmail funktioniert das mit `smtp.gmail.com`, Port `587`, `SMTP_SECURE=false` und einem Google-App-Passwort.

## TTS mit Piper

Für bessere kostenlose Sprachausgabe kann Frozenclaw serverseitig `Piper` nutzen. Der empfohlene Startpfad ist:

```bash
cd /opt/frozenclaw/app
bash scripts/server/install-piper.sh
```

Danach in `/etc/frozenclaw/frozenclaw.env` setzen:

```bash
PIPER_ENABLED=true
PIPER_COMMAND=/opt/frozenclaw/piper-venv/bin/piper
PIPER_MODEL_PATH=/opt/frozenclaw/piper/voices/de_DE-thorsten-medium.onnx
PIPER_CONFIG_PATH=/opt/frozenclaw/piper/voices/de_DE-thorsten-medium.onnx.json
PIPER_MAX_TEXT_LENGTH=800
PIPER_TIMEOUT_MS=20000
```

Anschließend die App neu bauen und neu starten. Die OpenClaw-Control-UI ruft dann serverseitig `/api/tts` auf und fällt nur noch bei Fehlern auf die Browserstimme zurück.

## Control UI

OpenClaw verlangt für die Browser-Control-UI standardmäßig zusätzlich Device-Auth/Pairing. Für die aktuelle Beta kann pro Instanz `OPENCLAW_CONTROL_UI_DISABLE_DEVICE_AUTH=true` gesetzt werden, damit der Zugriff ausschließlich über Gateway-Token läuft. Das ist bewusst ein Sicherheits-Downgrade und sollte nur verwendet werden, solange keine saubere Geräte-Pairing- oder Session-Lösung davorsteht.

## Managed

Der Managed-Pfad ist technisch vorbereitet, bleibt aber gesperrt, bis `OPENAI_MANAGED_API_KEY` serverseitig gesetzt ist und das echte Usage-Tracking am Providerpfad hängt.

Aktueller Zielzustand:

- Modell: `openai/gpt-5.2`
- `Managed Starter`: `500.000` Standard-Tokens fuer `9,90 EUR / Monat`
- `Managed Plus`: `3.000.000` Standard-Tokens fuer `39 EUR / Monat`
- `Managed Advanced`: `5.000.000` Standard-Tokens fuer `59 EUR / Monat`
- Nachbuchung geplant:
  - `1.000.000` Standard-Tokens für `9 EUR`
  - `2.500.000` Standard-Tokens für `19 EUR`

SQLite speichert dafür bereits:

- Managed-Provider und Managed-Modell pro Bestellung
- inklusives Tokenkontingent und internes Budget
- Usage-Events mit Standard-Tokens und Kostenfeldern
- spätere Top-up-Käufe

### Interner Testpfad fuer Managed

Sobald `OPENAI_MANAGED_API_KEY` auf dem Server gesetzt ist, kann ein Managed-Testfall ohne Stripe direkt erzeugt oder eine bestehende Instanz umgestellt werden:

```bash
cd /opt/frozenclaw/app
node scripts/server/seed-managed-order.mjs --email Frozenclaw9@gmail.com --plan managed_starter
```

```bash
cd /opt/frozenclaw/app
node scripts/server/seed-managed-order.mjs --email Frozenclaw9@gmail.com --plan managed_immediate
```

Optional laesst sich gezielt eine bestehende Instanz umstellen:

```bash
cd /opt/frozenclaw/app
node scripts/server/seed-managed-order.mjs --email Frozenclaw9@gmail.com --slug fc-451a2857ca --plan managed_advanced
```

Das Skript:

- setzt die Bestellung auf `managed_starter`, `managed_immediate` oder `managed_advanced`
- hinterlegt `openai/gpt-5.2`

## Testzugang

- bestehende Testkonten laufen auf `openai/gpt-4o-mini`
- Kontingent: `100.000` Standard-Tokens
- internes Ziel: etwa `0,05 USD` Modellkosten pro Testzugang
- setzt das Tokenkontingent passend zur gewaehlten Stufe
- erzeugt einen frischen Login-Link
- laesst die Bereitstellung ueber den bestehenden Recovery-Lauf der App wieder anlaufen

## Nächste echte Produktionsschritte

- zentralen Betreiber-Key per `OPENAI_MANAGED_API_KEY` setzen
- Usage-Tracking an den echten OpenAI-Pfad hängen
- Top-up-Kaufpfad ergänzen
- Stripe-Testmodus komplett durchspielen
