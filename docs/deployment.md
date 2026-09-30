# Free public deployment: Render + Neon

This uses the existing React/Vite frontend, Express API, and PostgreSQL schema.
Your folders, package files, and local run commands stay the same.

The frontend is a free Render Static Site, the backend is a Render Web Service
with `plan: free`, and the database is a separate Neon Free project.
Share the frontend URL with anyone; they can sign up as passengers or drivers.
The frontend's Test the app button also works without the backend.

## 1. Create the hosted database

1. Sign in at https://console.neon.tech and choose the **Free** plan.
2. Create a project named `dhaka-tesla-pool`. Choose a nearby available region
   (prefer Singapore to match the API). Use the default database or name it
   `dhaka_tesla_pool`.
3. In Neon's SQL Editor, run `database/migrations/001_initial_schema.sql` once
   on this new empty database, followed by `database/seeds/001_demo_data.sql`.
4. Open **Connect**, choose the pooled connection string, and keep the SSL
   parameters Neon includes. Copy it into Render's `DATABASE_URL` secret later.
   Do not paste it into GitHub, this document, or a frontend variable.

This creates a separate online database. Your current local accounts and rides
are not automatically copied. New online users can register normally; the seed
data supplies the predefined Dhaka areas and fictional story accounts.

## 2. Publish the deployment configuration to GitHub

The repository is `Zubaer-Habib-Sayham/dhaka-tesla-pool`.
Commit and push the deployment changes to the branch you want Render to deploy.
The `render.yaml` at the repository root defines both services and links them.

## 3. Deploy both services on Render

1. Sign in at https://dashboard.render.com.
2. Choose **New → Blueprint** and select the repository and the branch containing
   the deployment configuration.
3. Use `render.yaml` at the repository root. Check that the API plan is **Free**
   and the frontend is a **Static Site** before creating the services.
4. Paste the Neon connection string into the prompted `DATABASE_URL` field.
   Render generates `JWT_SECRET`; you do not need to enter a password or key.
5. Deploy the Blueprint. The backend's database health check must pass before it
   is considered healthy.
6. Open the frontend service's generated public HTTPS URL. This is the link to share.
   Render generates the final names/URLs; use the actual dashboard URL rather
   than assuming a particular hostname is available.

The frontend automatically receives the backend's **public** `RENDER_EXTERNAL_URL`
as `VITE_API_ORIGIN`. It appends `/api` when making requests. A Neon database URL
or JWT secret must never be placed in a `VITE_` variable.

### If Blueprint setup requests a payment card

Do not select a paid service. You can create the two free services manually:

| Setting | Backend Web Service | Frontend Static Site |
| --- | --- | --- |
| Root directory | `backend` | `frontend` |
| Build command | `npm ci` | `npm ci && npm run build` |
| Start command | `npm start` | Not applicable |
| Publish directory | Not applicable | `dist` |
| Plan | Free | Free static hosting |
| Health check | `/api/health/database` | Not applicable |

Set backend variables `NODE_ENV=production`, `NODE_VERSION=24.21.0`,
`DATABASE_URL` to the Neon SSL connection string, and `JWT_SECRET` to a generated
random secret of at least 32 characters. Set frontend `NODE_VERSION=24.21.0`
and `VITE_API_BASE_URL` to the actual backend HTTPS URL followed by `/api`.
Build the frontend again after changing its API address. Add the frontend rewrite
`/* → /index.html` if needed.

## 4. Check the live app

- The backend's `/api/health/database` returns `database: connected`.
- The frontend loads from a public HTTPS URL, including in a private browser.
- Passenger signup works, and a driver signup creates a rickshaw profile.
- The driver goes online and sees a passenger's ride request.
- Accept → arrive → start → complete updates the passenger's status and history.
- Browser requests use the hosted API, not `localhost:5000`.

## Free-plan behavior

- Render's free API sleeps after 15 minutes with no inbound traffic. The first
  request afterward can take about a minute. The static frontend stays available.
- Neon has monthly compute and storage limits; its Free plan currently includes
  100 CU-hours per project per month and 0.5 GB per project.
- Keep the services on their free plans, watch usage in the dashboards, and do
  not enable paid upgrades. Free hosting is suitable for this internship MVP;
  it does not provide an always-on production guarantee.
- Render's own free PostgreSQL expires after 30 days, so this setup uses Neon.

Official references, checked September 30, 2026:

- https://render.com/docs/free
- https://render.com/docs/static-sites
- https://render.com/docs/blueprint-spec
- https://neon.com/blog/neon-backend-is-ga
