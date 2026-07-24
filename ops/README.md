# Yaagam Operations Console

Separate Next.js App Router application for the operations portal at `console.yaagam.in`.

## Scope

- Operations-only routes and features.
- No customer pages.
- No customer authentication APIs.
- API base URL: `https://api.yaagam.in/api/v1/ops`.

## Run

```bash
npm install
npm run dev
```

The dev server uses port `3001`.

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