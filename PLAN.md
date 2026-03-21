# Frozenclaw.com - OpenClaw Hosting Platform
## Launch Plan v2

**Date:** 2026-03-21
**Status:** Revised after critical review
**Goal:** launch a small, reliable EU-hosted OpenClaw offering with a pragmatic beta architecture and a clear path to production hardening

---

## 1. Executive Summary

The previous plan mixed too many maturity levels into one step:

- demand capture
- automated provisioning
- production-ready recurring SaaS

That is the main planning error.

This version uses a pragmatic middle path:

- launch a Beta with payment and provisioning
- keep the persistence model simple
- harden the system before customer volume increases

The recommendation is:

1. ship a `Beta Launch` with payment plus provisioning
2. use SQLite as the source of truth from day 1
3. postpone heavier infra patterns until before meaningful customer count
4. call it "production-ready" only when billing, recovery, and privacy basics are in place

---

## 2. Current Repo Reality

Current local app state in `apps/frozenclaw`:

- a basic Next.js app exists
- there is no `app/api/checkout/route.ts` yet
- there is no provisioning backend in this repo yet
- current dependencies do not include `stripe` or `resend`

Implication:
this document is a target architecture and delivery plan, not a description of what already exists.

---

## 3. Product Scope

### Launch scope

- one plan only: `Founding Member`
- one OpenClaw instance per customer
- one region only: Hetzner Germany
- path-based access on `app.frozenclaw.com`
- email support only
- no custom domains at launch
- no multi-user teams at launch

### Explicit non-goals for launch

- no Team plan
- no Pro plan
- no custom onboarding calls baked into checkout
- no self-service instance deletion
- no "instant enterprise-ready" positioning

The earlier pricing table was too broad for the current execution level. Additional plans can be added after the first stable launch.

---

## 4. Launch Phases

### Phase 1 - Beta Launch

Goal: accept real payments and deliver working customer instances quickly without pretending the system is fully hardened.

Flow:

`Landing page -> Stripe Checkout -> webhook writes state -> async provisioning -> activation email or manual fallback`

Requirements:

- durable order state in SQLite
- Stripe event idempotency via `stripe_event_id`
- provisioning can run automatically
- manual fallback is possible if automation fails
- backup runs daily
- Impressum, Privacy Policy, and simple Beta Terms are online before first paying customer

What is acceptable in this phase:

- async provisioning in the same app process after the Stripe response is returned
- token delivery by email as an explicit MVP compromise
- manual retries by operator
- manual subscription follow-up if needed

What is not acceptable in this phase:

- email-based idempotency
- in-memory-only job state
- provisioning before persistent order state exists
- launch without legal basics for a German commercial site

### Phase 2 - Hardening Before Customer 10

Goal: remove obvious operational debt before the customer count makes manual recovery too risky.

Requirements:

- startup recovery for stuck provisioning jobs
- restore drill completed on a fresh server
- cancellation and archive flow documented
- retention policy defined
- better retry/reconciliation tooling
- decision made on recurring billing model

### Phase 3 - Production Baseline

Goal: make the service operable enough for ongoing paid usage at higher confidence.

Requirements:

- separate worker if operational load justifies it
- monitoring and alerting running
- disaster recovery playbook written and tested
- stronger customer access flow than plain token-by-email

Do not market the service as production-ready before this phase is complete.

---

## 5. Business Model Decision

### Recommended near-term model

Use a deposit-first launch model for Beta, then manually convert customers until recurring billing is worth formalizing.

Why this is recommended:

- the previous "5 EUR now, then manual subscription link later" flow is operationally possible
- it is acceptable for Beta, but it is not a durable billing architecture

### Not acceptable as final-state billing

- manual subscription creation forever
- coupon bookkeeping by hand
- charging customers before provisioning is reliable

### Decision point after first preorders

Choose one of these before or during Phase 2:

1. full Stripe Subscription flow
2. manual monthly invoicing with explicit service terms

If recurring service is offered without one of these being clear, support and accounting will become messy fast.

---

## 6. Target Architecture for Beta Launch

```text
Internet :443
    |
    v
Caddy
    |- /webhook/stripe -> internal app endpoint
    |- /status/<checkout_session_id> -> provisioning status page
    `- /agent/<slug>/* -> customer OpenClaw container

Next.js app / API
    |- creates Stripe checkout sessions
    |- verifies Stripe webhook signatures
    |- stores orders and event log in SQLite
    |- returns 200 to Stripe
    `- triggers async provisioning in-process

Docker
    `- one OpenClaw container per customer

Backups
    |- SQLite database
    |- customer config directories
    `- generated infrastructure files if not reproducible
```

### Key architecture decisions

- SQLite replaces `allocations.json` as source of truth
- Stripe webhook events are keyed by `event.id`
- provisioning does not run inline inside the webhook response path
- initial async provisioning runs in the same process after the Stripe response is sent
- startup recovery requeues stuck `provisioning` rows
- customer access path uses `/agent/<slug>` instead of `/c/<id>`
- generated route slug is random and URL-safe
- reserved words are checked by exact slug match, not substring match

This removes the earlier class of bugs where generated customer IDs collided with path rules or where parallel webhook processing could race on a flat JSON file, while avoiding premature worker complexity.

---

## 7. Data Model

Minimum SQLite tables for Beta:

### `orders`

- `id`
- `stripe_event_id` unique
- `stripe_session_id` unique
- `email`
- `plan`
- `payment_status`
- `instance_slug` unique nullable
- `instance_port` unique nullable
- `instance_state`
- `gateway_token` nullable
- `created_at`
- `updated_at`

Purpose:
single source of truth for payment and 1:1 instance state while customer count is small.

Recommended `instance_state` values:

- `pending`
- `provisioning`
- `ready`
- `failed`
- `archived`

### `event_log`

- `id`
- `order_id`
- `action`
- `details`
- `created_at`

Purpose:
basic auditability without introducing a larger schema too early.

When the product grows beyond the simple 1:1 model, split `instances` out into its own table.

---

## 8. Payment and Provisioning Flow

### Beta flow

```text
Landing page CTA
    -> POST /api/checkout
    -> Stripe Checkout (deposit or first payment)
    -> Stripe webhook verifies signature
    -> store stripe_event_id and order state in SQLite
    -> return 200 to Stripe
    -> app triggers async provisioning
    -> order marked ready
    -> customer sees ready state on success/status page
    -> customer receives activation email
```

### Rules

- webhook handler must never depend on a missing JSON file
- webhook handler must never use email as the sole idempotency key
- duplicate Stripe events are ignored by `stripe_event_id`
- provisioning retries must be safe
- failed provisioning must leave a visible failed state
- no silent success response if the order cannot be tracked
- startup must retry stale `provisioning` rows

### Customer-facing access delivery

For Beta, token delivery by email is acceptable as an explicit compromise.

Guardrails:

- token must be unique per instance
- token reset must be possible
- token must not grant broader admin/server access
- move away from email delivery in Phase 3

---

## 9. Provisioning Design

Provisioning must be stateful and idempotent.

### Instance states

- `pending`
- `provisioning`
- `ready`
- `failed`
- `archived`

### Provisioning sequence

1. app marks order state as `provisioning`
2. reserve next free port and random slug
3. persist slug, port, and token in SQLite
4. create customer config directory
5. start Docker container
6. write or regenerate Caddy route
7. validate Caddy config
8. reload Caddy
9. health-check container endpoint
10. mark instance `ready`
11. append event log entry

### Failure rules

- if container start fails: mark `failed`, keep logs
- if Caddy validate fails: do not reload, mark `failed`
- if health check fails: stop instance, mark `failed`
- if any step after resource creation fails: cleanup must be deterministic and logged
- if the app crashes mid-provisioning: stale `provisioning` rows are retried on startup

### Slug rules

- slug format: random lowercase hex or base32
- no customer email in URL
- no substring-based reserved-word blocking
- reserved list checks exact match only

Example reserved list:

- `webhook`
- `admin`
- `api`
- `status`
- `static`
- `assets`

---

## 10. Infrastructure Layout

```text
/opt/frozenclaw/
|- .env
|- data/
|  |- app.db
|  `- backups/
|- customers/
|  `- <instance-id>/
|- scripts/
|  |- provision.sh
|  |- deprovision.sh
|  |- backup.sh
|  `- restore-check.sh
`- logs/

/etc/caddy/
|- Caddyfile
`- customers.d/

/etc/systemd/system/
|- frozenclaw-app.service
`- frozenclaw-worker.service (later, if needed)
```

### Source of truth

Source of truth is SQLite, not generated files.

Generated artifacts must be reproducible from DB state:

- Caddy snippets
- customer metadata files
- status reports

That is essential for restore and recovery.

---

## 11. Ops and Monitoring

### Required services for Beta

- Caddy
- app service
- Docker

### Minimum health checks

- app health endpoint
- Docker daemon reachable
- Caddy config validates
- disk usage alert
- memory usage alert
- stale `provisioning` rows detected on startup or by periodic check

### Logging requirements

- structured app logs
- provisioning logs per order or instance
- no secrets in logs
- log rotation enabled

### Alerting

Telegram is acceptable for MVP alerting if it is reliable and tested.

Required alerts:

- webhook verification failures spike
- provisioning failure
- backup failure
- disk or memory threshold crossed

---

## 12. Backups and Restore

The old backup plan was incomplete because it only archived customer directories.

### Must-back-up items

- SQLite DB
- customer config directories
- generated Caddy files if regeneration is not yet implemented
- environment file stored separately and securely

### Backup schedule

- daily encrypted backup to Hetzner Storage Box
- local retention: 7-14 days
- remote retention: at least 30 days

### Restore drill

Before customer 10, perform one full restore test on a fresh server:

1. restore DB
2. restore customer files
3. regenerate Caddy config
4. start services
5. verify at least one restored instance works

For Beta, backups must run before launch even if restore has not yet been drilled. Before customer 10, restore must be tested.

---

## 13. Security and Privacy Baseline

For an EU-focused SaaS, this is mandatory work, not optional polish.

### Minimum controls before first paying customer

- Impressum published
- privacy policy published
- simple Beta terms published
- deletion workflow documented
- access to production server limited to named operators
- SSH keys only, no password login
- fail2ban or equivalent on SSH
- firewall only exposes 22, 80, 443
- secrets only in server-side environment files or secret store
- no real API keys or key fragments inside docs

For a German commercial site, the Impressum should be treated as a launch blocker. Since 2024-05-14, the relevant German provider-identification rule is no longer `TMG`, but `DDG` (`section 5 DDG`).

### Data handling rules

- do not store more PII than needed
- do not expose customer email in path or filename
- do not email long-lived access secrets by default
- archive canceled customers only for a defined retention window

Recommended initial retention policy:

- active customer data: while service is active
- canceled customer data: 30 days unless legal/accounting needs require longer
- Stripe and invoice data: per accounting rules

The exact wording can be simple for Beta, but it must exist before launch.

---

## 14. Realistic Cost View

The earlier "break-even at 1 customer" statement was too optimistic.

### Fixed monthly infrastructure estimate

- Hetzner VPS
- Hetzner backups
- Hetzner Storage Box
- domain and DNS costs
- transactional email provider

### Variable costs per customer

- Stripe fees
- support time
- failed payment and refund overhead
- occasional re-provisioning or migration effort

### Rule

Do not present break-even math publicly until a simple spreadsheet includes:

- infra fixed cost
- transaction fees
- refund assumption
- support time assumption
- tax treatment

---

## 15. Implementation Order

### Step 1 - Stabilize product framing

- reduce offer to one launch plan
- rewrite landing page copy around one concrete outcome
- remove claims that imply enterprise-grade readiness

### Step 2 - Add app dependencies and backend skeleton

- add `stripe`
- add email provider dependency if needed
- add SQLite dependency and migration strategy
- add internal config loading and validation

### Step 3 - Build Beta payment path first

- implement `POST /api/checkout`
- implement Stripe webhook endpoint
- persist orders and event log
- send payment confirmation email
- return Stripe response before starting provisioning
- trigger provisioning async in the same process

### Step 4 - Build provisioning and recovery

- implement idempotent provisioning script
- add instance status page
- add Caddy validation before reload
- add startup recovery for stale `provisioning` rows

### Step 5 - Add operational baseline

- systemd services
- health checks
- backup
- log rotation
- minimal alerting if feasible

### Step 6 - Launch gate review

- run test payments in Stripe test mode
- run at least one real end-to-end payment with low amount
- verify failed provisioning path
- verify manual fallback path
- verify legal pages are live

---

## 16. Go/No-Go Checklist

Launch is `NO-GO` if any of the following are false:

- checkout works in test mode
- webhook signature verification works
- duplicate Stripe event does not duplicate provisioning
- provisioning can fail without losing order state
- provisioning works automatically or there is a documented manual fallback
- at least one live instance is reachable from the public URL
- backups are running
- Impressum, Privacy Policy, and Beta Terms are published
- no real secrets are present in repo or docs

Launch is `GO` only when all are true.

---

## 17. Immediate Next Actions

### Marius

- decide whether the first charge is a deposit or the first billing period
- provision Hetzner server only after the billing path decision is made
- prepare Impressum, Privacy Policy, and simple Beta Terms
- remove any real key fragments from documentation

### Build work

- add missing backend dependencies to the app
- create DB schema for `orders` and `event_log`
- implement checkout and order persistence first
- do not start with Docker automation before order state exists

### Later, before customer 10

- implement worker-based provisioning if needed
- implement stronger activation flow
- run restore drill

---

## 18. Final Positioning

Frozenclaw can be launched quickly, but only if the claim matches the system.

Valid claims for the near term:

- EU-hosted
- beta hosted OpenClaw
- early access / founding member

Not yet valid without more work:

- production-ready SaaS
- fully automated recurring hosting platform
- low-touch support at scale

This plan is intentionally narrower and more pragmatic than the earlier versions. That is a strength, not a downgrade.
