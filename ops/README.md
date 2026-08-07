# Yaagam Operations Console

Separate Next.js App Router application for the operations portal at `console.yaagam.in`.

## Scope

- Operations-only routes and features.
- No customer pages.
- No customer authentication APIs.
- Backend requests use a same-origin server proxy.

## Run

```bash
npm install
npm run dev
```

The dev server uses port `3001`.

Set the backend URL as a server-only environment variable (never prefix it with `NEXT_PUBLIC_`):

```bash
OPS_API_BASE_URL=https://your-backend.example/api/v1/ops
TRUSTED_PROXY_SECRET=replace-with-the-same-strong-secret-used-by-the-backend
```

Use the same `TRUSTED_PROXY_SECRET` value in the Ops deployment and backend. The secret is added only by the server proxy and is never sent to browser code.

## Architecture

- `app`: route segments and layouts.
- `components`: shared layout and shadcn-style UI primitives.
- `features`: domain feature components.
- `hooks`: reusable client hooks.
- `lib`: local utility and auth persistence helpers.
- `providers`: React Query and future app providers.
- `services`: Axios API clients and ops service modules.
- `types`: shared TypeScript contracts.
- `utils`: constants and pure helpers.
- `middleware.ts`: route protection using the `ops_session` cookie.