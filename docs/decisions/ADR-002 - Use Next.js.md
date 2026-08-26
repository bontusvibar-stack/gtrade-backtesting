# ADR-002 — Use Next.js

- **Status:** Accepted
- **Date:** 2026-08-26

## Decision
We will build GTrade using **Next.js (App Router)** with React Server Components as the default, and client components only where interactivity is required.

## Context
GTrade needs server-side data access (Supabase), SEO-friendly docs/routes, and a fast React UI. The backtesting engine is framework-free, so the framework choice mainly affects routing, rendering, and data fetching.

## Alternatives Considered
- **Vite SPA** — Lighter and faster dev, but no built-in server rendering, no RSC, requires a separate backend for Supabase auth/data access and API routes.
- **Remix** — Strong data-loading model, but smaller ecosystem fit with our Supabase + RSC plans and less familiarity on the team.

## Reason
Next.js App Router gives us React Server Components (keep heavy/engine orchestration server-side), route handlers for API needs, first-class Supabase integration patterns, and a single deployment target. The framework-free engine means we are not locked into Next.js for core logic.

## Consequences
- Default to Server Components; mark interactive widgets `"use client"`.
- Keep all business logic out of `app/` routes (see Architecture.md).
- Team must follow App Router conventions (loading/error boundaries, server actions where useful).
