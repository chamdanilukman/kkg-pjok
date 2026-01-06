# Deploy to Cloudflare Pages (Pages Functions)

## Summary
This project uses Cloudflare Pages for the frontend and Pages Functions for the API.
The API runs on `/api/*` and connects to Neon via a server-side connection string.

## Fixed Issues (January 2025)

### 405 Method Not Allowed Error - RESOLVED
The original issue was caused by incorrect HTTP method handling in Cloudflare Functions. The fix includes:

1. **Individual Function Files**: Created specific function files for each endpoint:
   - `functions/api/auth/login.js` for login endpoint
   - Each function has proper HTTP method handlers (`onRequestPost`, `onRequestOptions`)

2. **CORS Headers**: Added proper CORS headers to all responses to prevent cross-origin issues.

3. **Environment Variables**: Ensured proper environment variable handling for Cloudflare Pages context.

4. **Direct Implementation**: Inlined the login logic to avoid TypeScript import issues in Cloudflare Workers environment.

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

## Function Structure
```
functions/
  api/
    auth/
      login.js  # Handles POST /api/auth/login with proper method routing
```

## Notes
- The API uses individual function files instead of a catch-all router
- Database access uses `@neondatabase/serverless` (Workers-compatible)
- Login logic is inlined to avoid TypeScript compilation issues
- Ensure `iuran_config` includes `updated_at` and `deleted_at` columns (see migration file)
- Apply `supabase/migrations/20260106_add_iuran_delete_flow.sql` to enable iuran delete approval flow
