# Frozenclaw

Frozenclaw ist eine Landing Page plus Beta-Checkout für gehostete OpenClaw-Instanzen. Der aktuelle Fokus liegt auf `Hosted BYOK`: Der Kunde bringt seinen eigenen Modell-Key mit, Frozenclaw übernimmt Hosting, Bereitstellung und den technischen Betrieb.

## Technischer Stand

- Next.js App Router
- Stripe Checkout und Webhook-Persistenz
- SQLite als Source of Truth
- asynchrone Provisionierung mit Recovery für hängende Jobs
- `mock`-Provisionierung für lokale Tests
- Platzhalterseiten für Impressum, Datenschutz und Beta-Bedingungen

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

Auf einem Linux-Host sollte die Web-App selbst weiterhin als unprivilegierter Nutzer laufen. Für Docker- und Caddy-Zugriffe wird deshalb `PROVISIONING_USE_SUDO=true` plus eine passende `sudoers`-Whitelist empfohlen; ein Template liegt unter [`ops/frozenclaw-provisioning.sudoers`](/C:/Users/Mariu/clawd/apps/frozenclaw/ops/frozenclaw-provisioning.sudoers).

## Statusfluss

1. `POST /api/checkout` erstellt eine Stripe-Session und speichert den Auftrag
2. `POST /api/webhook/stripe` schreibt die Bezahlung idempotent in SQLite
3. der Auftrag wird asynchron provisioniert
4. `/success?session_id=...` pollt den Status, bis die Instanz bereit oder fehlgeschlagen ist
5. beim App-Start werden `pending`- und veraltete `provisioning`-Aufträge erneut eingeplant

## Mailversand

Frozenclaw kann nach erfolgreicher Bereitstellung und bei fehlgeschlagener Provisionierung automatisch E-Mails versenden. Für Gmail funktioniert das mit `smtp.gmail.com`, Port `587`, `SMTP_SECURE=false` und einem Google-App-Passwort.

## Control UI

OpenClaw verlangt für die Browser-Control-UI standardmäßig zusätzlich Device-Auth/Pairing. Für die aktuelle Beta kann pro Instanz `OPENCLAW_CONTROL_UI_DISABLE_DEVICE_AUTH=true` gesetzt werden, damit der Zugriff ausschließlich über Gateway-Token läuft. Das ist bewusst ein Sicherheits-Downgrade und sollte nur verwendet werden, solange keine saubere Geräte-Pairing- oder Session-Lösung davorsteht.

## Nächste echte Produktionsschritte

- Server-Skript für Provisionierung anbinden
- echte Impressumsdaten eintragen
- Stripe-Testmodus komplett durchspielen
- E-Mail-Versand für Bereitstellung und Warnungen ergänzen
