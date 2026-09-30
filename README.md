# Dhaka Tesla Pool

Share a seat. Split the fare. Survive Dhaka traffic.

A ride-pooling MVP built with PostgreSQL, Express.js, React, and Node.js.

## Status

Passenger and driver signup/login, ride requests, fare estimates, pooling,
driver availability, active ride management, ride history, and animated trip progress.
The UI uses predefined Dhaka areas and a Bangladeshi rickshaw illustration.

## Architecture

See:

- [Architecture](docs/Dhaka-Tesla-Pool_Architecture_Diagram.png)
- [ERD](docs/erd.md)

## Tech Stack

- PostgreSQL
- Express.js
- React
- Node.js
- Docker

## Development

Use the existing `frontend/`, `backend/`, and `database/` folders. No framework,
dependency, schema, or folder migration is required for these updates.

Prerequisites: Node.js compatible with the existing Vite version, npm, and a running
PostgreSQL database with the existing migration and seed data applied.
The included Docker Compose file starts **only the database** on port 5433.

1. Start the database with `docker compose up -d db`, or use your existing PostgreSQL instance.
2. Configure `backend/.env` using `backend/.env.example` if it is not already configured.
   Keep your current database and JWT settings; never commit `.env`.
3. For a fresh database only, apply `database/migrations/001_initial_schema.sql`, then
   `database/seeds/001_demo_data.sql` using your PostgreSQL client. Do not reapply the
   initial migration to an already initialized database.
4. Run the backend and frontend in separate terminals from the repository root:

```powershell
cd backend
npm install # only if dependencies are missing
npm run dev
```

```powershell
cd frontend
npm install # only if dependencies are missing
npm run dev
```

Open the Local URL printed by Vite (normally `http://localhost:5173`).
The frontend connects to `http://localhost:5000/api` by default. Set
`VITE_API_BASE_URL` if your backend uses another address.

## Test the app

The opening page's **Test the app** button launches an isolated browser-session
demo as Jashim driving Bullet. Nusrat has an assigned ride and Rafiq has a waiting
request. Accept a request, mark arrival, start, and complete a ride; use **View as
passenger** to inspect Nusrat's status, fare, and history. Exit test mode and enter
again to reset the sample rides. Demo changes never create accounts or touch the database.
Real accounts use **Sign up → Passenger / Driver**. Drivers enter a rickshaw name
and a fixed capacity of 1–3 seats, then go online from their dashboard.

Validation commands:

```powershell
cd frontend
npm run lint
npm run build
```

```powershell
cd backend
node --test src/services/driver-flow.test.js
```

The API integration tests require a reachable PostgreSQL database and permission
to create a temporary schema. They use an isolated `dtp_driver_test_<pid>` schema
and remove it afterward; existing application data is untouched. Tests cover
signup, role/ride ownership, concurrent claims for the last seat, repeated status
clicks, cancellation, pool completion, and fare consistency.

## Driver flow

`GET /api/driver/rides` returns only rides assigned to the authenticated driver,
including passenger names, routes, seat counts, pool membership, fares, and status.
The driver uses the existing accept/arrive/start/complete endpoints. Driver and
passenger dashboards refresh every five seconds; passenger trip details refresh
every three seconds. Trip animations represent lifecycle stages, not GPS positions.

Status order: `REQUESTED → MATCHED → DRIVER_ARRIVED → STARTED → COMPLETED`.
Passengers may cancel only requested or matched rides. Drivers must finish active
rides before going offline. Vehicle locks serialize acceptance, cancellation, and
status changes; transitions are validated while the ride is locked. Completed and
cancelled passengers free seats, and pools close when no active passengers remain.

## Current limitations

The test dashboard simulates rides locally; use real accounts for database-backed
testing. TeslaPay remains simulated and payment status is displayed as stored.
Polling provides status updates without WebSockets. Existing Docker Compose
configuration runs the database; frontend and backend still run separately.

## Free public hosting

See [deployment instructions](docs/deployment.md) for Render's free frontend/API
hosting and a Neon Free PostgreSQL database. The root `render.yaml` creates and
connects the two Render services. Local development keeps the same commands and
defaults; hosted frontend builds use `VITE_API_ORIGIN` or `VITE_API_BASE_URL`.
