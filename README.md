# Classroom Turn Picker

A free, browser-only participant turn selector for classroom discussion, group activities, and practice sessions.

## Scope and privacy

- This is an education and turn-taking utility, not a lottery or gambling product.
- It has no payments, tickets, bets, cash prizes, or prize claims.
- Participant names are processed in the current browser session only.
- Names are not sent to an API, saved to local storage, or stored in a database.
- This version intentionally has no Supabase dependency because it does not need persistent participant data.

## Run tests

Requires Node.js 26.x.

    npm test

Open `public/index.html` through a local static server, or use the Vercel preview deployment.

## Deploy on Vercel

1. Import this GitHub repository into Vercel.
2. Keep the project framework preset as **Other**.
3. Set the production branch to `main` only after reviewing and merging the changes.
4. The output directory is `public` and the build command runs `npm test`.
5. Deploy the preview first and test the page before promoting it to production.

The optional `/api/health` endpoint is a simple deployment health check. It does not connect to a database.

## Configuration

No environment variables, database credentials, or API keys are required for this static app.
