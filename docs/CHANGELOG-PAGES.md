# Pages Functions Migration Notes

## What changed
- Added Pages Functions router at `functions/api/[[path]].ts` to serve `/api/*`.
- Switched API DB client to `@neondatabase/serverless` in `api/lib/db.ts`.
- Updated API defaults to match schema (`draft` status, `anggota` role).
- Standardized client API base URL to `/api`.
- Updated hooks to use query `?id=` for update/delete requests.
- Fixed form defaults to use valid enum values and correct payment field key.
- Made API client tolerant of empty (204) responses.
- Linked notulen and gallery items to activities, with attendance recap under QR for admin.
- Added iuran delete request flow (bendahara requests, admin approves) and UI history table.
- Added `wrangler.toml` with `nodejs_compat` for Pages Functions.
- Updated `.env` to use non-`VITE_` secrets.

## Environment variables
- `NEON_DATABASE_URL`
- `JWT_SECRET`
