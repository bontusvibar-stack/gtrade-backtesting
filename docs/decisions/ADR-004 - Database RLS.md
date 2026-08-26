# ADR-004 — Database RLS

- **Status:** Accepted
- **Date:** 2026-08-26

## Decision
We will **enable Row Level Security (RLS)** on every user-owned Supabase table. Users may access only their own records, and the server will **never trust client-supplied user IDs** for authorization.

## Context
GTrade stores user strategies, data, and backtest results. A multi-tenant data model requires strict isolation so one user cannot read or modify another's data.

## Alternatives Considered
- **App-level only checks** — Easier but error-prone; a single missed check leaks data. Rejected in favor of defense-in-depth.
- **Disable RLS** — Simpler queries, but unsafe for multi-tenant; rejected.

## Reason
RLS enforces isolation at the database layer regardless of application bugs. Authorization is derived from the authenticated JWT (`auth.uid()`), not from any `owner_id` sent by the client. This is the Supabase-recommended pattern.

## Consequences
- Every table with user data has an `owner_id` and RLS policies using `auth.uid()`.
- API routes and clients pass only the JWT; the `owner_id` is resolved server-side.
- Schema (PLANNED) and migrations must include RLS policies from day one.
