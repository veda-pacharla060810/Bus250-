# Bus 250

Verified before this zip was made:
- Clean npm install + npm run build, from a completely fresh state
- Confirmed .env.local does not exist anywhere in this zip
- Grepped every single file in the zip for both Supabase key VALUES -- zero
  matches anywhere, including this README

## What's in this version
- Chat, Journal, Gallery, Tickets, Route Map (with named bus stops), Odometer,
  Love Notes, Snacks Tray, Mood Lighting, Photo Booth
- Ambient Sounds instead of Spotify (rain / engine hum / quiet -- generated
  in-browser, no external service, no API keys needed)
- netlify.toml with the Next.js plugin (fixes the earlier 404 issue)
- .gitignore that excludes .env.local so it can never leak into git again

## STEP 1 -- Create your local env file (AFTER unzipping)
In the unzipped folder, create a new file named exactly .env.local with this
shape (see .env.local.example for the same thing):

NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

Your specific values are the ones you already have from your Supabase
dashboard (Project Settings -> API) and from earlier in our conversation.
They are intentionally NOT written in this file, so that this README can
never trip a secrets scanner if it ends up in a public repo.

This .env.local file will NOT be committed to GitHub (the .gitignore blocks
it) -- that is intentional, and is exactly what caused the last build to
fail (a real secret sitting inside a committed file).

## STEP 2 -- Push to GitHub (VS Code)
1. Source Control icon -> Initialize Repository
2. Commit message "Bus 250" -> Commit
3. Publish Branch -> create a NEW repo (recommended: a fresh name)
4. After publishing, open the repo on github.com and confirm:
   - .env.local is NOT listed as a file
   - .env.local.example IS listed (this one's safe, just placeholders)
   If .env.local shows up in the repo, stop and tell me before deploying.

## STEP 3 -- Netlify
1. Add new site -> Import this repo
2. Site configuration -> Environment variables -> add these 3, with your
   REAL values this time (Netlify's environment variables screen is the
   correct, safe place for real secrets -- never a committed file):
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY
   - SUPABASE_SERVICE_ROLE_KEY (mark as "secret" when Netlify offers that option)
3. Deploys tab -> Trigger deploy -> Clear cache and deploy site

## If your service_role key was ever exposed on GitHub before now
Rotate it: Supabase Dashboard -> Project Settings -> API -> regenerate the
service_role key -> update the new value in Netlify's environment variables.
