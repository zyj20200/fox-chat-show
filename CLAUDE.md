# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Chat history viewer for MySQL-stored conversations. Next.js 16 App Router, single-page client app with three API routes. Chinese language UI.

## Commands

```bash
npm run dev      # Dev server on port 2000
npm run build    # Production build
npm run start    # Production server on port 2000
```

No test or lint commands are configured.

## Setup

```bash
cp .env.local.example .env.local  # Then edit DB credentials
npm install
```

## Architecture

- **`app/page.tsx`** — Entire UI in one client component. Two-panel layout: session list (left) + chat detail (right). Uses plain `useState` for all state. Includes a DB config modal.
- **`lib/db.ts`** — MySQL connection pool singleton (`mysql2/promise`). Supports runtime config changes via `setConfig()` which tests the new connection before swapping.
- **`app/api/sessions/route.ts`** — `GET /api/sessions` — paginated session list with search on `query_text` and `app_name`.
- **`app/api/session/[id]/route.ts`** — `GET /api/session/:id` — all messages for a session, ordered by `created_at`.
- **`app/api/db-config/route.ts`** — `GET/POST /api/db-config` — read (password masked) and update DB connection at runtime.

## Key Patterns

- Multi-turn conversations are stored in `user_question` column delimited by `\n------\n`. The `parseTurns()` function in `page.tsx` splits these into individual Q&A pairs.
- Tailwind CSS v4 (CSS-first config via `@import "tailwindcss"` in `globals.css`, no `tailwind.config.js`).
- Path alias: `@/*` maps to project root.
- The `chat_history` MySQL table schema is documented in README.md.

## Environment Variables

`DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` — see `.env.local.example`.
