# Product Design: Collector

## Core Problem

Organizations require structured data from external or cross-functional individuals. Current methods rely on ad‑hoc spreadsheets, inconsistent formats, email attachments, and manual normalization. Requesters lose time explaining schemas. Responders lose time formatting outputs. Collaboration chains break on sign‑in friction.

## Product Summary

A web workspace that behaves like a preconfigured spreadsheet. Columns defined with descriptions. Shareable link. No signup required for basic contribution. Drag‑and‑drop file ingestion. Automatic parsing and field extraction using language models. Contributors can enter data directly, reorder columns, and attach files. The requester receives clean, normalized data.

## Product Principles (Durable Spec)

This doc is written to survive iterations.

* **User stories and loops are the source of truth.** They should remain stable even as UI, schemas, and implementation details evolve.
* **Data models are provisional.** Expect them to change as real usage reveals the right abstractions.
* **Minimize friction at the edges.** The best growth is created by effortless sharing and instant contribution.
* **Gate creation power, not viewing.** Virality requires that recipients can view (and ideally fork) without hard walls.

## Primary User Flows

### 1. Requester (Creator)

* Creates a new workspace.
* Defines columns with data types and descriptions.
* Generates a shareable link.
* Sends link to one or multiple recipients.
* Monitors submissions and exports results.

### 2. Contributor (No Account)

* Opens shared link.
* Reads column descriptions.
* Enters data directly in rows.
* Drags and drops source files in arbitrary formats.
* System parses and fills fields.
* Adds additional rows as needed.

### 3. Contributor (Account Optional)

* Signs in via **passwordless email OTP** if they want a persistent identity.
* Can invite teammates by forwarding the link.
* Access controlled by tokenized link parameters.

## Core User Stories (MVP Anchors)

### Requester (Creator)

* **As a requester,** I can define a schema (columns + descriptions) so contributors understand exactly what I need.
* **As a requester,** I can generate a share link so I can collect data without onboarding meetings.
* **As a requester,** I can see submissions in a clean grid and export them, so I can ship the work downstream.
* **As a requester,** I can revoke or rotate access, so I can control distribution when needed.

### Contributor (Viewer / Editor)

* **As a contributor,** I can open the link and contribute immediately, so I’m not blocked by account creation.
* **As a contributor,** I can upload “messy” source files and have fields extracted, so I don’t have to manually reformat data.
* **As a contributor,** I can correct extracted values in-place, so the final dataset is trustworthy.
* **As a contributor,** I can optionally verify my email via OTP, so my contributions can be attributed to me across sessions.

### Viewer → New Creator (Viral Conversion)

* **As a viewer of a shared workspace,** I can fork it into my own workspace, so I can reuse the structure for my own project.
* **As a viewer,** I can export the dataset, so I can use the result even if I never sign up.

## Core Features

### Schema Definition

* Column types: text, number, date, categorical, attachment.
* Column descriptions to define intent.
* Optional constraints for validation.

### Data Parsing

* File ingestion supporting CSV, Excel, PDF, images, JSON exports.
* Language model‑based extraction into the defined schema.
* Review stage for corrections.

### Data Editing

* Spreadsheet‑like grid.
* Inline editing.
* Column reorder.
* Bulk paste.

### Collaboration

* Multi‑user concurrent editing.
* Version capture on each contribution.
* Change attribution when contributors authenticate.

### Export

* CSV and XLSX exports.
* API endpoint for automated pull.

## Access and Auth Model

* Default: link‑based access with embedded workspace token.
* Optional **passwordless email OTP** for identity binding (no passwords).
* Workspace owner can revoke links or disable anonymous editing.

## Go-to-Market (Bootstrapped + Viral)

### Positioning (one sentence)

**Turn messy inputs from other people into a clean, shareable dataset—without sign-in friction.**

### Choose a single initial ICP

Pick one “share-heavy” niche first (where work must be collected externally and redistributed internally), e.g.:

* Agencies collecting client inputs
* RevOps/ops collecting vendor/customer data
* Researchers collecting structured findings
* Founders running customer discovery pipelines

### The growth loop (the thing to optimize)

**Creator uploads / defines schema → sends share link → viewer contributes or exports → viewer forks → invites teammates → repeats.**

### Product levers that make the loop viral

* **Sharable artifact**: the shared view is useful even to non-users (clean, readable, exportable).
* **Fork CTA** on shared view: “Use this template / Fork into my workspace” (one click).
* **Export CTA** on shared view: “Export CSV/XLSX” (don’t paywall viewing).
* **Light branding**: “Made with DataColab” on shared views, with a single primary action (“Fork”).
* **Referral unlocks**: higher limits unlocked when invited users activate (not just sign up).

### Distribution that compounds (no ads)

* **Templates-as-acquisition**
  * Build 10–30 high-intent templates (customer discovery tracker, lead cleanup, hiring pipeline, research log, onboarding checklist).
  * Each template has its own share link + fork button.
  * Publish template landing pages for SEO (“<job> template (clean + share)”).
* **Integrations with embedded distribution**
  * Prioritize **Google Sheets import/export** (sharing is already native).
  * Make CSV ingestion feel magical (instant cleanup + extraction + share link).
* **Community seeding**
  * Earn trust in 2–3 communities where people already trade templates and workflows.

### Launch sequence (repeatable)

* **Pre-launch**: template library + polished share page (fork/export) + 2–3 ICP landing pages.
* **Launch 1**: targeted community posts + “I’ll clean your CSV into a shareable view” outreach to 20 power users.
* **Launch 2**: Show HN / Indie Hackers with before/after and 3 templates.
* **Ongoing**: ship 1 distribution feature/month (Sheets, Notion/Airtable import, web embed).

### North-star GTM metric

**Share-to-signup conversion**: % of unique share-link viewers who create/fork a workspace within 7 days.

## Virality Mechanisms (In-Product)

* Every contributor sees an unobtrusive banner stating: "Create your own workspace".
* One‑click duplication of existing workspace structure (“Fork”).
* Shared view supports export + templating to keep the artifact valuable to non-users.
* Workspace templates (RFPs, vendor onboarding, product data forms, research trackers).

## Pricing Model

### Free Tier

* Unlimited workspaces with up to N contributors per workspace.
* Basic file parsing with size limit.
* Share links + viewing enabled.
* Manual export enabled (keep the artifact useful).

### Pro Tier

* Per‑seat simple pricing.
* Unlimited contributors.
* Advanced file ingestion.
* API access.
* SLA for data extraction.

### Enterprise Tier

* Domain‑wide controls.
* SSO.
* Audit logs.
* Dedicated workspace templates.

## Technical Architecture

### Frontend

* Spreadsheet grid component.
* Column definition panel.
* File dropzone with progress feedback.

### Backend

* Schema metadata store.
* Workspace state store with versioning.
* File ingestion pipeline.
* Model‑based parsing service.

### Security

* Signed workspace tokens for shared links.
* Row‑level attribution for authenticated users.
* Encrypted storage for attachments.

## Competitive Positioning

* Reduces friction of data collection.
* No requirement for contributors to sign up.
* File‑first workflow with schema enforcement.
* Simple, predictable pricing.

## Expansion Surface

* Automated cleaning rules.
* Column‑level AI suggestions.
* Workflow actions on data submission.
* Integration with CRMs and procurement systems.
