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
