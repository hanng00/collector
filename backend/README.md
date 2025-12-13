# Backend (AWS SAM)

Serverless backend for Collector: single-table DynamoDB, uploads bucket, Lambdas wired to API Gateway + S3 events.

## Install
```bash
bun install
```

## Build / Validate
```bash
sam validate
sam build
# sam local start-api  # once AWS creds + envs are configured
```

## Functions
- `CreateMagicLink` — POST `/auth/magic-links`
- `CreateWorkspace` / `ListWorkspaces` / `GetWorkspace` — `/workspaces`
- `CreateShareLink` — POST `/workspaces/{workspaceId}/share-links`
- `ValidateShareLink` — GET `/share-links/{token}`
- `GetColumns` / `PutColumns` — `/workspaces/{workspaceId}/columns`
- `ListRows` / `UpsertRow` — `/workspaces/{workspaceId}/rows`
- `PostUpload` / `GetUpload` — `/workspaces/{workspaceId}/uploads`
- `ExtractUpload` — S3 ObjectCreated trigger
- `ExportRows` — GET `/workspaces/{workspaceId}/export`

Zod models live in `src/contracts` and are imported via `@/contracts`.
