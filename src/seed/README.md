# Bookora Demo Seeder

This seeder is intentionally isolated from app startup and only runs through dedicated npm scripts.

## Scripts

- `npm run seed:demo`
- `npm run seed:demo:clear`

## Environment guardrails

The entrypoint refuses to run unless:

- `ENABLE_DEMO_SEEDER=true`
- `SEED_SCENARIO=demo`

The npm scripts set those values automatically.

## Demo credentials

All seeded demo accounts use the shared password:

- `DemoPass123!`

The account list lives in [data/demoUsers.ts](/Users/kate/Desktop/TestAPI/BOOKORA-backend/src/seed/data/demoUsers.ts).
