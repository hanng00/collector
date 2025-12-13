# Product Design: Collector

## Core Problem

Organizations require structured data from external or cross-functional individuals. Current methods rely on ad‑hoc spreadsheets, inconsistent formats, email attachments, and manual normalization. Requesters lose time explaining schemas. Responders lose time formatting outputs. Collaboration chains break on sign‑in friction.

## Product Summary

A web workspace that behaves like a preconfigured spreadsheet. Columns defined with descriptions. Shareable link. No signup required for basic contribution. Drag‑and‑drop file ingestion. Automatic parsing and field extraction using language models. Contributors can enter data directly, reorder columns, and attach files. The requester receives clean, normalized data.

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

* Signs in via one‑click email code if they want persistent identity.
* Can invite teammates by forwarding the link.
* Access controlled by tokenized link parameters.

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
* Optional email verification for identity binding.
* Workspace owner can revoke links or disable anonymous editing.

## Virality Mechanisms

* Every contributor sees an unobtrusive banner stating: "Create your own workspace".
* One‑click duplication of existing workspace structure.
* Requesters generating multiple workspaces accumulate a free tier that encourages upgrades.
* Workspace templates for RFPs, vendor onboarding, product data forms.

## Pricing Model

### Free Tier

* Unlimited workspaces with up to N contributors per workspace.
* Basic file parsing with size limit.
* Manual export only.

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
