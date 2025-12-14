# Web (Next.js App Router)

Collector UI with landing, owner workspaces, and share-link intake. React Query + axios power API calls.

## Run
```bash
bun install
bun dev
```

## Key routes
- `/` — marketing/flow overview
- `/signin` — owner magic-link request
- `/workspaces` — owner list
- `/workspaces/[workspaceId]` — columns, uploads, dropzone
- `/links` — issued share links
- `/share/[token]` — contributor experience (tokenized link, upload + review)

Environment:
- `NEXT_PUBLIC_API_URL` — backend base URL (optional; defaults to `http://localhost:3000`)
- `NEXT_PUBLIC_APP_URL` — used to render share link previews
- `NEXT_PUBLIC_COGNITO_USER_POOL_ID` — Cognito User Pool ID (from AWS SAM stack outputs)
- `NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_ID` — Cognito User Pool Client ID (from AWS SAM stack outputs)
- `NEXT_PUBLIC_AWS_REGION` — AWS Region (e.g., `eu-west-1`)

Create a `.env.local` file in the `web/` directory with these variables. Get the Cognito values from your deployed AWS SAM stack outputs.
