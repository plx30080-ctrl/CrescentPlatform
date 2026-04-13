# CrescentPlatform

Unified account management tool for Crescent operations. Built with data consistency as the foundational constraint — PostgreSQL enforces integrity at the database level through foreign keys, triggers, and transactional functions.

## Modules

- **Associate Database** — Single source of truth for every person. Track status, pipeline, profiles, and attendance.
- **Badge Management** — Customizable badge printing with barcode generation and print queue.
- **Data Entry & Import** — Manual entry forms and Excel/CSV import with column mapping.
- **Analytics Dashboards** — Headcount, fill rate, attendance, recruiter performance, and YOY comparisons.
- **Early Leaves & Corrective Action** — Track departures, manage disciplinary actions, auto-sync DNR status.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + TypeScript + Vite |
| UI | MUI v7 + Chart.js |
| Database | PostgreSQL via Supabase |
| Auth | Supabase Auth |
| Storage | Supabase Storage |
| Hosting | Vercel |

## Setup

1. Clone the repo
2. Copy `.env.example` to `.env.local` and fill in your Supabase credentials
3. Run the SQL migrations in `supabase/migrations/` against your Supabase project (in order: 001, 002, 003, 004)
4. Install dependencies and start:

```bash
npm install
npm run dev
```

## Data Consistency

All data flows through a single PostgreSQL database with:
- **Foreign keys** — `associates.eid` is the universal key referenced by badges, early leaves, hours, and headcount records
- **ACID transactions** — Badge creation, on-premise data submission, and other multi-table operations are atomic
- **Database triggers** — DNR status, new start pipeline updates, and hours sync happen automatically
- **UNIQUE constraints** — Prevent duplicate badges, duplicate headcount entries per date+shift, and duplicate hours records
