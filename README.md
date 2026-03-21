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
- `PROVISIONING_SCRIPT`: Skriptpfad für echte Provisionierung im `script`-Modus
- `PROVISIONING_PORT_START`: Start des Portbereichs
- `PROVISIONING_PORT_END`: Ende des Portbereichs
- `PROVISIONING_STALE_MINUTES`: ab wann hängende Provisionierungen erneut angefasst werden
- `AGENT_BASE_PATH`: öffentlicher Pfad vor dem Instanz-Slug, standardmäßig `/agent`

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

## Statusfluss

1. `POST /api/checkout` erstellt eine Stripe-Session und speichert den Auftrag
2. `POST /api/webhook/stripe` schreibt die Bezahlung idempotent in SQLite
3. der Auftrag wird asynchron provisioniert
4. `/success?session_id=...` pollt den Status, bis die Instanz bereit oder fehlgeschlagen ist
5. beim App-Start werden `pending`- und veraltete `provisioning`-Aufträge erneut eingeplant

## Nächste echte Produktionsschritte

- Server-Skript für Provisionierung anbinden
- echte Impressumsdaten eintragen
- Stripe-Testmodus komplett durchspielen
- E-Mail-Versand für Bereitstellung und Warnungen ergänzen
