# Collector

Schema-led data collection with magic links for owners, tokenized share links for contributors, and LLM-assisted extraction.

## Structure
- `web/` — Next.js App Router UI (landing, owner workspaces, share-link intake).
- `backend/` — AWS SAM stack (single-table DynamoDB, uploads bucket, Lambdas behind API Gateway + S3 events).
- `shared/contracts/` — Zod models shared across frontend/backend via `@contracts/*`.

## Run
- Install deps: `bun install` at repo root (uses workspaces) or in both `web/` and `backend/`.
- Frontend: `cd web && bun dev`.
- Backend: `cd backend && sam validate` or `sam local start-api` once AWS credentials and envs are configured.

## Flow
1) Owner signs in passwordlessly (Cognito email OTP) and manages workspaces.
2) Owner defines columns and issues share links (`/share-links/{token}`) for contributors.
3) Contributors upload files (`/workspaces/{id}/uploads`) and rows update asynchronously via S3-triggered extraction.
4) Owners monitor uploads/rows and export structured data (`/workspaces/{id}/export`).
