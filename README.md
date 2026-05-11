# Victoria Hertel Site

## Local setup

Requirements:

- Node `22.x`
- npm
- a `GITHUB_TOKEN` with access to `vanghoa/victoria-hertel-site`

Install and run:

```bash
npm install
npm run dev
```

Production build check:

```bash
npm run build
```

## Data and cache model

The site reads timeline/content history from GitHub on the server.

- `utils/AllData/githubClient.tsx` uses `unstable_cache(...)` for GitHub and MDX-derived data.
- `app/api/buildRevalidate/route.ts` invalidates the tagged caches with `revalidateTag(...)`.
- `app/api/githubFetch/route.ts` is still available, but server code no longer depends on calling the deployed site over HTTP during build.

Current cache tags:

- `fetchNavData`
- `fetchPageCommitDetails`
- `fetchParamsPairObj`
- `fetchOctokitPaginate`
- `fetchPageContent`

## Updating the site

When content or code changes:

1. Edit the files in `public/content`, `public/assets`, or the app code.
2. Run a local build:

```bash
npm run build
```

3. Commit the changes:

```bash
git add .
git commit -m "Describe the update"
```

4. Push `main`:

```bash
git push origin main
```

5. Redeploy on Vercel. If auto-deploy is enabled for `main`, the push should trigger it automatically.

## Revalidating cached GitHub data

If the deployed site is already up and you need to refresh cached GitHub-derived data without changing code, call:

```text
GET /api/buildRevalidate
```

Example:

```bash
curl https://your-site-domain/api/buildRevalidate
```

Use this when:

- GitHub content/history changed
- the deployment is live but still showing stale timeline/content cache

## Notes for future changes

- Prefer `unstable_cache` for server-side computed data instead of making the server call its own API route.
- Always run `npm run build` before pushing content or dependency changes.
- If dependencies change, commit both `package.json` and `package-lock.json`.
