# WPForms n8n Integration (Addon + n8n Trigger node)

## Summary

**Goal:** Deliver a first‑class, zero‑friction bridge between WPForms and n8n using a **Webhook-like** integration in WPForms and a **single n8n WPForms Community Node (Trigger)** 

**End result for users:**

* From the WPForms **Marketing** tab, users enable “n8n Integration,” paste a webhook URL from n8n, map fields (including Smart Tags), optionally set Conditional Logic, and click **Save**.
* Every form submission is shipped to n8n **reliably and securely** (HMAC‑signed, timestamped) with minimal configuration.
* In n8n, the **WPForms (Trigger)** node validates the signature, parses the payload (fields, meta, files), and makes the data immediately available to downstream nodes (e.g., CRM, Sheets, Slack, email).

This pairing creates an out‑of‑the‑box automation path for WPForms customers to orchestrate actions across hundreds of services without writing code.

---

## Benefits

Describe the benefits of the rock/feature. How does it help our users and relate to our core values?

1. **Simplicity & Speed** — A familiar WPForms marketing‑integrations panel with field mapping and Conditional Logic gets users live in minutes.
2. **Reliability** — Background queue with retries (Action Scheduler), idempotency keys, and observable logs reduce data loss and duplicates.
3. **Security** — HMAC‑SHA256 signatures, timestamps (anti‑replay), selective field inclusion, and masked secrets in logs protect PII.
4. **Scalability** — n8n workflows can fan out to CRMs, data warehouses, email tools, and custom APIs without additional WP plugins.
5. **Compatibility & Extensibility** — Works with core WPForms features (Smart Tags, Conditional Logic, File Uploads, AntiSpam). The trigger node cleanly models WPForms’ payload so downstream steps are predictable.
6. **Ownership** — Supports self‑hosted n8n instances for customers who need data residency and privacy controls.

---

## Risks

* **Misconfiguration:** Wrong webhook URL or secret causes 401s; need clear validation and error UX.
* **n8n Downtime/Latency:** Remote endpoint failures could queue many pending jobs; must cap retries and expose DLQ (dead‑letter queue) visibility.
* **Large Files/Attachments:** Oversized uploads or slow links can exceed timeouts
* **Spam/Abuse Traffic:** If anti‑spam is bypassed, noisy submissions could pressure queues; Conditional Logic and spam status checks should gate dispatch.
* **GDPR/PII Handling:** Users may transmit sensitive data; provide clear docs, field‑level exclusions, and hashing options for specific fields (e.g., phone).
* **Version Drift:** n8n node updates vs. addon payload changes require semantic versioning and a stable contract.

---

## Addon Compatibility

**Expected:** No code changes required in addons. If “send after payment” is enabled, we’ll hook into existing payment completion actions.

---

## Technical Overview

We will build a WPForms addon and a n8n community node.
Pair addon + n8n node enables an end‑to‑end bridge: the addon pushes signed, structured submissions while the node validates, normalizes, and triggers flows in n8n.

### WPForms Addon

**Settings UI (Builder → Marketing → n8n Integration):**

Support multiple connections. Similar to WPForms Make addon. 

* **Enable toggle**
  * Enables the integration.

When enabled the default connection settings block appears:

* **Send on event**
  * Dropdown field:
    * Form Submitted - `wpforms_process_complete`
    * Entry Created - `wpforms_process_entry_saved`
    * Entry Marked as Spam - `wpforms_pro_anti_spam_entry_marked_as_spam`
    * Payment Completed - `wpforms_process_payment_saved`
     
* **Webhook URL** (required)
  * Text field to copy-paste the webhook URL from n8n.
  * **Check connection** button (or icon) next to the URL field to validate the URL.
    * If valid, a green checkmark appears.
    * If invalid, a red exclamation mark appears next to the URL field.

* **Field Mapping** — map form fields/Smart Tags to JSON body keys.
  * Standard WPForms field mapping UI with Custom values and Smart Tags.
    
* **Conditional Logic** — reuse WPForms’ conditional editor.
  * Standard WPForms conditional logic UI.
  
* **Test Send** — sends a sample payload to the provided URL. 
  * Shows the HTTP status & response snippet in a standard modal. (need text/design)
  * This can be standardized to be re-used in other integrations like Webhooks, Make, etc. addons. 
  
**Dispatch Flow:**

1. On event (selected in the Send on Event dropdown), create and enqueue the new **Action Scheduler** task.
2. The task builds payload:
   * `form` (id, name), `entry` (id, createdAt), `fields` (resolved values), `meta` (ip, referrer, utm, page), `files` (array of `{name, size, mime, url}`)
   * Add filter to be able to modify the payload programmatically 

4. Compute headers:
```json
{
  "X-WPForms-Signature": "sha256=<HMAC(body, secret)>",
  "X-WPForms-Timestamp": "<ISO8601>",
  "X-WPForms-Idempotency": "<entryId-hash>"
}
```
   
4. Send via `wp_remote_post()` with sane timeouts;
   * Use HTTP POST method
   * Sane timeouts (up to 30sec)
   * Backoff on 5xx/network error with delay (1min)
     * Add filter to be able to be able to configure backoff delay value
   * Max attempts N (up to 5 by default)
     * Add filter to be able to be able to configure max attempts value

   
5. Log each attempt (status, duration, response up to N chars).

**Files Handling:**

* Prefer direct URLs if publicly accessible.
* Option to **base64 encoded** attachments included in the payload JSON.

**Payload Contract (example):**

```json
{
  "form": {
    "id": 123,
    "name": "Contact Us"
  },
  "entry": {
    "id": 4567,
    "createdAt": "2025-08-28T11:23:45Z"
  },
  "fields": {
    "full_name": "John Doe",
    "email": "john.doe@example.com",
    "message": "Hi! I'd like to learn more about your services.",
    "subscribe": true,
    "interests": ["Forms", "Automation"],
    "rating": 5,
    "appointment": "2025-09-05T14:30:00Z"
  },
  "meta": {
    "ip": "203.0.113.10",
    "referrer": "https://example.com/landing",
    "utm": {
      "source": "google",
      "medium": "cpc",
      "campaign": "summer_sale",
      "term": "wpforms",
      "content": "cta_button"
    },
    "page": {
      "url": "https://example.com/contact",
      "title": "Contact Us",
      "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      "language": "en-US"
    }
  },
  "files": [
    {
      "name": "resume.pdf",
      "size": 58231,
      "mime": "application/pdf",
      "url": "https://example.com/uploads/2025/08/resume.pdf"
    }
  ]
}
```

### Code Placement

```
wpforms-n8n
├── assets
│   ├── css
│   ├── js
│   └── scss
├── languages
│   └── wpforms-n8n.pot
├── src
│   ├── Install.php
│   └── Plugin.php
├── CHANGELOG.md
├── composer.json
├── composer.lock
├── gulpfile-config.json
├── gulpfile.js
├── package.json
└── wpforms-n8n.php
```

### n8n Community Node (Trigger: “WPForms”)

Single trigger node that receives WPForms submissions via a secure n8n webhook and emits one item per submission.

* Documentation: [Build a programmatic-style node](https://docs.n8n.io/integrations/creating-nodes/build/programmatic-style-node/)
* Node style: Programmatic (prefered for trigger nodes)
* Type: Trigger 


#### Settings:

* **Webhook URL**
  * Required field.
  * The node registers an n8n webhook and shows a copy‑to‑clipboard URL.
  * Paste this value into the WPForms integration “Webhook URL” field.
  * Supports two environments (e.g., Test vs. Production) via n8n’s standard webhook UI.
  * Autogenerated by n8n, the field is editable.

* **Secret Key**
  * Required or optional?
  * Autogenerated by n8n, the field is readonly.
  * Type: *WPForms HMAC Verify*.
  * Used to compute/verify HMAC‑SHA256 over the raw request body.

* **Timestamp skew**
  * Optional 
  * Allowed timestamp skew: Default 300s; configurable per node.

* **Idempotency**
  * Optional.
  * Built‑in dedup cache keyed by signature + timestamp.
  * Configurable TTL (e.g., 10–60 minutes).
  * Behavior: drop duplicates by default; optional flag to emit with `meta.isDuplicate = true` instead.

* **Output Schema**
  * Optional
  * Dropdown, two options:
    * Default: Emits 1 item per submission with properties: `form`, `entry`, `fields`, `files`, `meta` (same structure as the example above).
    * Raw: Emits 1 item per submission with properties: `body` (raw JSON string), `headers` (object).

### Features:  

* **Error & Retry Behavior**
  * On validation failure: respond 4xx (no retry by WPForms).
  * On internal errors: respond 5xx so WPForms can retry per its backoff policy.
  * On success: respond 2xx immediately after acceptance; downstream n8n workflow errors are handled by n8n.

```
wpforms-n8n-node
├── nodes
│   └── WPForms
│       ├── WPForms.node.json
│       ├── WPForms.node.ts
│       └── WPForms.svg
├── .editorconfig
├── .eslintrc.js
├── .eslintrc.prepublish.js
├── .gitignore
├── .npmignore
├── .prettierrc.js
├── CODE_OF_CONDUCT.md
├── gulpfile.js
├── index.js
├── LICENSE.md
├── package.json
├── README.md
├── README_TEMPLATE.md
└── tsconfig.json
```

- The n8n node should be based on the cloned repository https://github.com/n8n-io/n8n-nodes-starter
- After creating the node it should be submitted to the [npm registry](https://docs.npmjs.com/packages-and-modules/contributing-packages-to-the-registry)
- Then we will submit the node for [verification by n8n](https://docs.n8n.io/integrations/creating-nodes/deploy/submit-community-nodes/#submit-your-node-for-verification-by-n8n)
- Users can discover and install verified community nodes from the nodes panel in n8n 

---

## Security

* **HMAC‑SHA256 signature** of the exact request body with a user‑provided secret.
* **Timestamp header** and ±5‑minute default skew to mitigate replay.
* **Idempotency key** to prevent duplicates on retries.
* **Least‑privilege UI:** role caps to view/edit integration settings.
* **Logs hygiene:** mask secrets; truncate large bodies.

---

## Challenges and Hurdles

* **Build n8n node:** We do not have such expirience, it's hard to estimate time and efforts. 
* **Queue pressure & backoff tuning:** Picking defaults that balance reliability and timeliness.
* **Self‑hosted n8n variability:** TLS/cert issues, reverse proxies, rate limits, or auth challenges on user servers.
* **DX/UX polish:** Making Test Send errors actionable; surfacing misconfig states clearly in Builder.

---

## Tasks and Time Estimates

*(Rough, engineering days; includes integration testing where relevant)*

### 1. WPForms n8n Addon

| Subtask | Estimate (Days) |
|---|---|
| Addon scaffold | 1 |
| Form Builder settings panel | 1–2 |
| Processing (payload, signing, retries/backoff) | 2–3 |
| **Total** | **4–6** |

### 2. n8n WPForms Trigger Node

| Subtask | Estimate (Days) |
|---|---|
| Node scaffold, learn the docs | 1 |
| Implementation (webhook, validation, options) | 3–4 |
| **Total** | **4–5** |

---
**Assumptions:**

* Reuse existing Conditional Logic editor; no new UI component there.
* Payments “send after success” hook available in Stripe/PayPal addons.
* Signed URLs implementable on supported hosting; otherwise fallback to direct/public URLs.

**Out of Scope (v1):**

* API‑driven workflow provisioning in n8n
* Bi‑directional lookups/enrichment
