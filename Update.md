## Production & contributors report

To generate or refresh `**ProductionReport.md**` (production dynamics, monthly chart, monthly contributor counts, and full contributor ranking):

1. Create `**.env**` in this `.github` folder with `GITHUB_TOKEN=your_token` (same requirements as before for public/private repos).
2. From the `**.github**` folder, install dependencies once (creates `node_modules/` next to `package.json`, gitignored):

```bash
npm install
```

1. Generate the report:

```bash
node scripts/generate-production-report.mjs --org HyperlinksSpace
```

Or: `npm run report` (same as above, org fixed to HyperlinksSpace in `package.json`).

Optional flags: `--out OtherName.md`, `--include-forks`, `--include-archived`.

### If you see `Request failed … Empty response body`

**HTTP 204 No Content** with an empty body is valid for some GitHub **list** routes (e.g. contributors); the script now treats that as an empty list, so you should not see retries for 204 anymore.

Remaining **empty-body** lines on **200** are usually **transient** (network/TLS), especially with many parallel calls. The script **retries** up to 5 times. Contributor fetches use **limited parallelism** (default **3**). To tune:

```bash
set GITHUB_REPO_CONCURRENCY=2
node scripts/generate-production-report.mjs --org HyperlinksSpace
```

(On PowerShell: `$env:GITHUB_REPO_CONCURRENCY=2`.)

Output files:

- `ProductionReport.md` — full report (production first, then contributors).
- `images/commits-by-month.svg` and `images/commits-by-month.png` — chart assets.

## Contributors-only list (legacy)

To write **only** `Contributors.md` (no production section):

```bash
npx tsx scripts/contributors.ts --org HyperlinksSpace --out Contributors.md
```

The consolidated report above is preferred; it includes the same contributor tables plus production metrics.