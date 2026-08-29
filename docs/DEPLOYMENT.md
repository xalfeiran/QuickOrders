# Deployment

## Backend

The backend deploy workflow is `.github/workflows/deploy-backend.yml`.
It deploys `backend/` to the server path in `DEPLOY_PATH`.

## Frontend

The frontend deploy workflow is `.github/workflows/deploy-frontend.yml`.
It builds the Vite app and deploys only `frontend/dist/` to the server path
in `FRONTEND_DEPLOY_PATH`.

Use a dedicated document root for `FRONTEND_DEPLOY_PATH`. The deploy sync
deletes stale built assets, while preserving cPanel-managed `.well-known/` and
`cgi-bin/` directories.

Required GitHub repository secrets:

```
SSH_HOST=your-domain.com
SSH_PORT=22
SSH_USER=youruser
SSH_PRIVATE_KEY=<private SSH key with access to the hosting account>
FRONTEND_DEPLOY_PATH=/home/youruser/public_html
VITE_API_BASE_URL=https://api.your-domain.com/api
```

Optional:

```
FRONTEND_HEALTHCHECK_URL=https://your-domain.com
```

The frontend action also accepts `DEPLOY_FRONTEND_PATH` as a fallback name for
`FRONTEND_DEPLOY_PATH`.
