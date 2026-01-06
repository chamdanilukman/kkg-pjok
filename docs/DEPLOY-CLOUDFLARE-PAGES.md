# Deploy to Cloudflare Pages (Pages Functions)

## Summary
This project uses Cloudflare Pages for the frontend and Pages Functions for the API.
The API runs on `/api/*` and connects to Neon via a server-side connection string.

## Fixed Issues (January 2025)

### 405 Method Not Allowed Error - RESOLVED
The original issue was caused by incorrect HTTP method handling in Cloudflare Functions. The fix includes:

1. **Separate HTTP Method Handlers**: Instead of using a single `onRequest` handler, we now use specific handlers for each HTTP method:
   - `onRequestPost` for POST requests (fixes login issue)
   - `onRequestGet` for GET requests  
   - `onRequestPut` for PUT requests
   - `onRequestDelete` for DELETE requests
   - `onRequestPatch` for PATCH requests
   - `onRequestOptions` for CORS preflight requests

2. **CORS Headers**: Added proper CORS headers to all responses to prevent cross-origin issues.

3. **Environment Variables**: Ensured proper environment variable handling for Cloudflare Pages context.

## Required environment variables (Cloudflare)
- `NEON_DATABASE_URL`
- `JWT_SECRET`

## Build settings (Cloudflare Pages)
- Build command: `npm run build`
- Output directory: `dist`

## Local development
1) Set `.env` with `NEON_DATABASE_URL` and `JWT_SECRET`.
2) Run `npm install`.
3) Run `npm run dev`.

## Testing the Login Fix
After deployment, test the login endpoint:
```bash
curl -X POST https://your-site.pages.dev/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

The response should now be successful instead of returning a 405 error.

## Notes
- The API is routed through `functions/api/[[path]].ts`.
- Database access uses `@neondatabase/serverless` (Workers-compatible).
- Ensure `iuran_config` includes `updated_at` and `deleted_at` columns (see migration file).
- Apply `supabase/migrations/20260106_add_iuran_delete_flow.sql` to enable iuran delete approval flow.
