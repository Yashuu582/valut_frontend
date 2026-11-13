# BalanceVault — Frontend
The backend code is available in the GitHub repository: https://github.com/Yashuu582/vault_backend

React web app for BalanceVault: sign-in, registration and onboarding, role-aware dashboards, admin tools and
the audit log viewer. This repository is standalone. It talks to the BalanceVault API, which lives in its own repository ([vault_backend](https://github.com/Yashuu582/vault_backend)), only over HTTP.

| Piece | Technology |
|---|---|
| UI | React 18, React Router 6 |
| Build / dev server | Vite 6 |
| Container | nginx (unprivileged) serving the static build |

## Connect to the backend (`.env`)

```bash
copy .env.example .env      # macOS/Linux: cp .env.example .env
```

```env
VITE_API_URL=http://localhost:8000
```

- The browser calls this URL directly, with cookies (`credentials: 'include'`).
- The backend's `CORS_ORIGINS` must include this app's address (default `http://localhost:5173`).
- Use the same host name on both sides (`localhost` with `localhost`, not mixed with `127.0.0.1`),
  otherwise the auth cookies are not sent.
- Vite reads `.env` at startup: restart `npm run dev` after changing it.

## Run locally

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # production build into dist/
```

## Run with Docker

`VITE_API_URL` is baked into the JavaScript at build time, so pass it as a build argument (and rebuild when it
changes):

```bash
docker build -t balancevault-frontend --build-arg VITE_API_URL=http://localhost:8000 .
docker run -d -p 5173:8080 --name balancevault-frontend balancevault-frontend
```

Open http://localhost:5173. nginx serves `index.html` for every app route, so refreshing `/admin/users` works.

## Deploy (Vercel, free)

1. In [`vercel.json`](vercel.json), replace `YOUR-BACKEND` with the backend's Render name (3 places). Commit and push.
2. **Vercel** → Add New → Project → import this repository. Framework **Vite**, build `npm run build`,
   output `dist`. **No environment variables** (leave `VITE_API_URL` unset).
3. Deploy, then put the Vercel URL in the backend's `CORS_ORIGINS` and `FRONTEND_URL`.

`vercel.json` forwards `/api`, `/health` and `/ready` to the backend, so the browser sees a single origin and
the httpOnly auth cookies work. It also serves `index.html` for app routes such as `/admin/users`.

## Pages and access

| Route | Page | Roles |
|---|---|---|
| `/login`, `/register` | Sign in · create profile (onboarding step 1) | guests |
| `/` | Dashboard (holder view or admin/auditor view) | all signed-in users |
| `/accounts` | My accounts · apply for an account (onboarding step 2) | account holder |
| `/admin/accounts` | Onboarding queue: approve / reject, freeze / unfreeze | admin (auditor read-only) |
| `/admin/users` | User management | admin |
| `/audit` | Audit log with filters | admin, auditor |

Navigation per role is defined in `src/lib/nav.js`. The backend enforces access; the UI only hides what a role
cannot use.

## Project layout

```
src/
  main.jsx, App.jsx        entry point and routes
  lib/                     API client (auto session refresh), auth context, formatting, nav config
  components/              layout, route guards, UI pieces
  pages/                   one file per page
  styles.css
Dockerfile, nginx.conf
```
The backend code is available in the GitHub repository: https://github.com/Yashuu582/vault_backend
