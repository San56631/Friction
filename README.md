# FRICTION — Campus Issue Reporting Platform

React + Vite + Tailwind + Supabase (Auth, Postgres, Storage). Signed-in users read and write the real database; demo mode (no `.env.local`) still uses `localStorage`.

## Run it
```bash
npm install
cp .env.example .env.local     # then fill in the two values below
npm run dev
```
Without `.env.local` the app runs in demo mode (persona switcher, no sign-in). With it, users land on a Google sign-in screen.

## Google sign-in setup (one time)

1. **Supabase**: create a project. Project Settings → API → copy the Project URL and the anon/publishable key into `.env.local` as `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
2. **Database**: SQL Editor → paste all of `supabase/schema.sql` → Run (safe to re-run). It creates the tables, row-level security, the rules below, and the `issue-photos` storage bucket.
3. **Google Cloud Console** (console.cloud.google.com):
   - APIs & Services → OAuth consent screen → External. While in Testing mode, add your teammates' emails under Test users.
   - Credentials → Create credentials → OAuth client ID → Web application.
   - Authorized JavaScript origins: `http://localhost:5173` and your Vercel URL.
   - Authorized redirect URI: `https://YOUR-PROJECT-REF.supabase.co/auth/v1/callback`
   - Copy the Client ID and Client Secret.
4. **Supabase** → Authentication → Providers → Google → enable, paste Client ID and Secret, save.
5. **Supabase** → Authentication → URL Configuration: set Site URL to your Vercel URL and add `http://localhost:5173/**` and `https://YOUR-VERCEL-URL/**` under Redirect URLs.
6. **Vercel**: add the same two `VITE_` variables under Project Settings → Environment Variables, then redeploy.
7. **Make yourself admin**: sign in once, then run in the SQL Editor:
   `update public.profiles set role = 'admin' where email = 'you@example.com';`

## Rules enforced by the database (not just the UI)
- Max 3 new reports per user per rolling 24 hours (`app_settings.daily_report_limit`, admin-editable)
- One confirmation per user per issue; you cannot confirm your own issue
- Students cannot change report status, severity or notes; only admins can (RLS)
- Every rejection needs a reason
- Three open flags on a published report move it to `Flagged` for review; one flag does not
- New reports publish automatically unless a content check holds them (link, blocked words, gibberish, repeat, account strike); admins can edit the word list, switch auto-publish off and set the flag threshold
- Every status/severity/link change and confirmation is written to `audit_log`, and status changes notify the reporter
- Temporary restrictions: `select public.record_abuse('<user uuid>', 'reason');` (1st = warning, 2nd = 24h, 3rd+ = 7 days)

## Map
Leaflet + OpenStreetMap. Five buildings have coordinates (CSE & ECE, IT, Computer Centre, Mechanical, Auditorium). For the others, sign in as admin, select the building, click **Place pin**, then click the map. Pins are saved to `public.buildings`. Use **Move pin** to correct a wrong one (check the IT Block pin against the satellite view).

Clicking the map drops a pin and looks up the place name through OpenStreetMap's Nominatim service (fine for demo-scale use; heavy traffic would need a different geocoder). Reports made from a pin are stored with their exact latitude/longitude and show as small severity-coloured dots on the map.

## Testing
See `TESTING.md` for a step-by-step check of every acceptance test in the brief.
