/**
 * Consolidated report: production dynamics (commits + chart + monthly contributors) and org contributors.
 * Run from the `.github` directory: node scripts/generate-production-report.mjs --org YourOrg
 *
 * Outputs: ProductionReport.md (chart image links to github.com/.../raw/.../images/commits-by-month.png), images/commits-by-month.svg, images/commits-by-month.png (`npm install` + sharp optional for PNG raster)
 */
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { writeCommitsChartSvg } from "./commits-chart-svg.mjs";
import { tryWriteChartPng } from "./svg-to-png.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const IMAGES_DIR = path.join(REPO_ROOT, "images");
const API_BASE = "https://api.github.com";
const FETCH_TIMEOUT_MS = 45_000;
const SEARCH_DUMMY = "NOT doesnotexist12345";
/** Parallel repo contributor fetches. Default 3: high values (e.g. 8) often cause empty response bodies on Windows/TLS when many sockets hit api.github.com at once. Override: GITHUB_REPO_CONCURRENCY=4 */
const REPO_CONCURRENCY = Math.max(1, Number(process.env.GITHUB_REPO_CONCURRENCY ?? 3));

/** Base URL for `raw` images in markdown (GitHub displays these reliably). Override: PRODUCTION_REPORT_RAW_BASE */
const CHART_RAW_BASE = (process.env.PRODUCTION_REPORT_RAW_BASE ?? "https://github.com/HyperlinksSpace/.github/raw/main").replace(
  /\/$/,
  ""
);

function stripWrappingQuotes(value) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  return value;
}

async function loadDotEnv() {
  const envPath = path.join(REPO_ROOT, ".env");
  try {
    const raw = await fs.readFile(envPath, "utf8");
    for (const originalLine of raw.split(/\r?\n/u)) {
      const line = originalLine.trim();
      if (!line || line.startsWith("#")) continue;
      const eqIndex = line.indexOf("=");
      if (eqIndex <= 0) continue;
      const key = line.slice(0, eqIndex).trim();
      const value = stripWrappingQuotes(line.slice(eqIndex + 1).trim());
      if (key && !Object.prototype.hasOwnProperty.call(process.env, key)) {
        process.env[key] = value;
      }
    }
  } catch {
    /* optional */
  }
}

function parseArgs(argv) {
  const args = argv.slice(2);
  let org = "";
  let output = "ProductionReport.md";
  let includeForks = false;
  let includeArchived = false;
  for (let i = 0; i < args.length; i += 1) {
    const token = args[i];
    if (token === "--org" && args[i + 1]) {
      org = args[i + 1];
      i += 1;
      continue;
    }
    if (token === "--out" && args[i + 1]) {
      output = args[i + 1];
      i += 1;
      continue;
    }
    if (token === "--include-forks") {
      includeForks = true;
      continue;
    }
    if (token === "--include-archived") {
      includeArchived = true;
      continue;
    }
  }
  return { org, output, includeForks, includeArchived };
}

function fetchTimeoutSignal() {
  if (typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function") {
    return AbortSignal.timeout(FETCH_TIMEOUT_MS);
  }
  const c = new AbortController();
  setTimeout(() => c.abort(), FETCH_TIMEOUT_MS);
  return c.signal;
}

async function githubRequest(url, token, attempt = 1) {
  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "generate-production-report",
      },
      signal: fetchTimeoutSignal(),
    });
    const text = await response.text();
    if (!response.ok) {
      throw new Error(`GitHub API ${response.status} for ${url}\n${text}`);
    }
    /** GitHub sometimes returns 204 No Content for “no data” list views (e.g. contributors) instead of 200 + `[]`. */
    if (response.status === 204) {
      if (url.includes("/search/")) {
        return { total_count: 0, items: [] };
      }
      return [];
    }
    const trimmed = text.trim();
    if (!trimmed) {
      throw new Error(
        `Empty response body (HTTP ${response.status} ${response.statusText}). ` +
          "Often transient when many parallel requests hit the API; lower GITHUB_REPO_CONCURRENCY or retry."
      );
    }
    return JSON.parse(trimmed);
  } catch (err) {
    if (attempt < 5) {
      const wait = 1500 * 2 ** (attempt - 1);
      console.error(`Request failed (attempt ${attempt}), retry in ${wait}ms: ${String(err?.cause ?? err)}`);
      await sleep(wait);
      return githubRequest(url, token, attempt + 1);
    }
    throw err;
  }
}

async function fetchPaginated(url, token) {
  const all = [];
  let page = 1;
  const perPage = 100;
  while (true) {
    const pageUrl = `${url}${url.includes("?") ? "&" : "?"}per_page=${perPage}&page=${page}`;
    const body = await githubRequest(pageUrl, token);
    if (body.length === 0) break;
    all.push(...body);
    if (body.length < perPage) break;
    page += 1;
  }
  return all;
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

function monthUtcRange(year, month) {
  const first = `${year}-${pad2(month)}-01`;
  const last = new Date(Date.UTC(year, month, 0));
  const y = last.getUTCFullYear();
  const m = pad2(last.getUTCMonth() + 1);
  const d = pad2(last.getUTCDate());
  const lastStr = `${y}-${m}-${d}`;
  return `${first}..${lastStr}`;
}

function enumerateMonths(fromYear, fromMonth, toYear, toMonth) {
  const out = [];
  let y = fromYear;
  let m = fromMonth;
  while (y < toYear || (y === toYear && m <= toMonth)) {
    out.push({ y, m, key: `${y}-${pad2(m)}` });
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
  }
  return out;
}

function asciiBar(value, max, width) {
  if (max <= 0) return "·".repeat(width);
  const n = Math.round((value / max) * width);
  return "█".repeat(Math.max(0, n)) + "·".repeat(Math.max(0, width - n));
}

async function sleep(ms) {
  await new Promise((r) => setTimeout(r, ms));
}

async function mapPool(items, concurrency, mapper) {
  const results = new Array(items.length);
  let index = 0;
  async function worker() {
    while (true) {
      const i = index;
      index += 1;
      if (i >= items.length) break;
      results[i] = await mapper(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, () => worker()));
  return results;
}

async function searchCommitTotal(q, token) {
  const url = `${API_BASE}/search/commits?q=${encodeURIComponent(q)}&per_page=1`;
  const body = await githubRequest(url, token);
  return typeof body.total_count === "number" ? body.total_count : 0;
}

/**
 * Commits in month (total_count) and distinct author logins from paginated search (max 1000 commits indexed).
 */
async function searchMonthCommitStats(baseQuery, range, token) {
  const q = `${baseQuery} committer-date:${range}`;
  const authors = new Set();
  let page = 1;
  let totalCount = 0;

  while (page <= 10) {
    const url = `${API_BASE}/search/commits?q=${encodeURIComponent(q)}&per_page=100&page=${page}`;
    const data = await githubRequest(url, token);
    if (page === 1) totalCount = data.total_count ?? 0;
    for (const item of data.items ?? []) {
      const login = item.author?.login;
      if (login) authors.add(login);
    }
    if (!data.items?.length || data.items.length < 100) break;
    if (page * 100 >= Math.min(totalCount, 1000)) break;
    page += 1;
    await sleep(2100);
  }

  return {
    commits: totalCount,
    contributors: authors.size,
    contributorsCapped: totalCount > 1000,
  };
}

function mdEscape(text) {
  return String(text).replaceAll("|", "\\|");
}

async function main() {
  await loadDotEnv();
  const { org, output, includeForks, includeArchived } = parseArgs(process.argv);
  const githubToken = process.env.GITHUB_TOKEN;
  if (!org) {
    throw new Error("Missing --org. Example: node scripts/generate-production-report.mjs --org HyperlinksSpace");
  }
  if (!githubToken) {
    throw new Error("Missing GITHUB_TOKEN (env or .env in .github).");
  }

  await fs.mkdir(IMAGES_DIR, { recursive: true });

  const baseQuery = `org:${org} ${SEARCH_DUMMY}`;
  console.error(`Commit search (org total): ${baseQuery}`);
  const searchTotal = await searchCommitTotal(baseQuery, githubToken);
  await sleep(2100);

  const now = new Date();
  const endYear = now.getUTCFullYear();
  const endMonth = now.getUTCMonth() + 1;
  const months = enumerateMonths(2022, 1, endYear, endMonth);

  const monthlyStats = new Map();
  console.error(`Monthly commit search (${months.length} months)…`);

  for (let i = 0; i < months.length; i += 1) {
    const { y, m, key } = months[i];
    const range = monthUtcRange(y, m);
    const stats = await searchMonthCommitStats(baseQuery, range, githubToken);
    monthlyStats.set(key, stats);
    console.error(`  ${key}: commits=${stats.commits} contributors=${stats.contributors}${stats.contributorsCapped ? " (sample cap)" : ""}`);
    if (i < months.length - 1) await sleep(2100);
  }

  const sortedMonths = months.map(({ key }) => key);
  const counts = sortedMonths.map((k) => monthlyStats.get(k)?.commits ?? 0);
  const maxCount = counts.length ? Math.max(...counts) : 0;
  const sumMonthly = counts.reduce((a, b) => a + b, 0);

  const svgPath = path.join(IMAGES_DIR, "commits-by-month.svg");
  const chartTitle = `Commits by month (UTC committer date), ${org}`;
  await writeCommitsChartSvg(svgPath, sortedMonths, counts, chartTitle);
  const pngOk = await tryWriteChartPng(svgPath);
  if (!pngOk) {
    console.error("Warning: PNG not generated (optional: npm install at repo root for sharp). Chart markdown still uses raw GitHub URL.");
  }

  console.error(
    `Fetching per-repo contributors for Contributors section (concurrency ${REPO_CONCURRENCY})…`
  );
  const repos = await fetchPaginated(`${API_BASE}/orgs/${org}/repos?type=all`, githubToken);
  const filteredRepos = repos.filter((r) => {
    if (!includeForks && r.fork) return false;
    if (!includeArchived && r.archived) return false;
    return true;
  });

  const contributorsMap = new Map();
  const repoContributorRows = await mapPool(filteredRepos, REPO_CONCURRENCY, async (repo) => {
    try {
      return await fetchPaginated(`${API_BASE}/repos/${repo.full_name}/contributors?anon=0`, githubToken);
    } catch {
      return [];
    }
  });
  for (let ri = 0; ri < filteredRepos.length; ri += 1) {
    const repo = filteredRepos[ri];
    const repoContributors = repoContributorRows[ri];
    for (const c of repoContributors) {
      const existing = contributorsMap.get(c.login) ?? {
        login: c.login,
        htmlUrl: c.html_url,
        totalCommits: 0,
        repos: new Map(),
      };
      existing.totalCommits += c.contributions ?? 0;
      existing.repos.set(repo.name, (existing.repos.get(repo.name) ?? 0) + (c.contributions ?? 0));
      contributorsMap.set(c.login, existing);
    }
  }
  const contributorFilteredTotal = Array.from(contributorsMap.values()).reduce((s, c) => s + c.totalCommits, 0);

  const ranked = Array.from(contributorsMap.values()).sort((a, b) => b.totalCommits - a.totalCommits);
  const generatedAt = new Date().toISOString();
  const lines = [];

  lines.push(`# ${org} — production & contributors (GitHub API)`);
  lines.push("");
  lines.push(`Generated at: ${generatedAt}`);
  lines.push("");

  lines.push("## Production dynamics");
  lines.push("");
  lines.push(
    "Commit totals use the [GitHub Commit Search API](https://docs.github.com/en/rest/search/search#search-commits) with a dummy term (`NOT doesnotexist12345`) so the query is not qualifiers-only. **Contributors** per month are **distinct GitHub `author` logins** returned by commit search for that month’s `committer-date` range (see note below if a month exceeds 1000 indexed commits)."
  );
  lines.push("");
  lines.push("| Metric | Value |");
  lines.push("| --- | ---: |");
  lines.push(`| Organization | \`${org}\` |`);
  lines.push(`| **Total commits (org search)** | **${searchTotal}** |`);
  lines.push(`| Sum of monthly commit counts (${sortedMonths[0] ?? "n/a"}–${sortedMonths[sortedMonths.length - 1] ?? "n/a"}) | ${sumMonthly} |`);
  lines.push(`| Contributor commit sum, non-fork non-archived repos (${filteredRepos.length} repos) | ${contributorFilteredTotal} |`);
  lines.push("");

  lines.push("### Chart");
  lines.push("");
  lines.push(
    `Vector: [\`images/commits-by-month.svg\`](images/commits-by-month.svg) · Raster: [\`images/commits-by-month.png\`](images/commits-by-month.png). **Y-axis** starts at **0**. **Bar colors** run red → green by commit volume within the chart range. On **GitHub**, the chart image below uses an absolute \`raw\` URL so it renders like other org assets. For local preview, open [\`images/commits-by-month.png\`](images/commits-by-month.png).`
  );
  lines.push("");
  lines.push(
    `![Commits by month — production chart](${CHART_RAW_BASE}/images/commits-by-month.png)`
  );
  lines.push("");

  lines.push("### Monthly breakdown");
  lines.push("");
  lines.push(
    "`*` = that month has more than **1000** commits in GitHub search; only the first 1000 results are available, so **contributor count may be understated** (distinct authors in the sample)."
  );
  lines.push("");
  lines.push("| Month (UTC) | Commits | Contributors | Bar (scaled) |");
  lines.push("| --- | ---: | ---: | --- |");
  const barWidth = 28;
  for (const k of sortedMonths) {
    const st = monthlyStats.get(k);
    const n = st?.commits ?? 0;
    const c = st?.contributors ?? 0;
    const cap = st?.contributorsCapped ? " *" : "";
    lines.push(`| ${k} | ${n} | ${c}${cap} | \`${asciiBar(n, maxCount, barWidth)}\` |`);
  }
  lines.push("");

  lines.push("## Contributors");
  lines.push("");
  lines.push(
    "Per-repository contributor counts from [`GET /repos/{owner}/{repo}/contributors`](https://docs.github.com/en/rest/collaborators/collaborators#list-repository-contributors) (same rules as \`scripts/contributors.ts\`: forks and archived repos excluded unless flags are used)."
  );
  lines.push("");
  lines.push(`Repositories scanned: **${filteredRepos.length}** · Unique contributors: **${ranked.length}**`);
  lines.push("");
  lines.push("### Ranking");
  lines.push("");
  lines.push("| Rank | Contributor | Total commits | Profile |");
  lines.push("| ---: | --- | ---: | --- |");
  for (let idx = 0; idx < ranked.length; idx += 1) {
    const c = ranked[idx];
    lines.push(
      `| ${idx + 1} | ${mdEscape(c.login)} | ${c.totalCommits} | [${mdEscape(c.htmlUrl)}](${c.htmlUrl}) |`
    );
  }
  lines.push("");
  lines.push("### Per-contributor repository breakdown");
  lines.push("");
  for (let idx = 0; idx < ranked.length; idx += 1) {
    const c = ranked[idx];
    const repoEntries = Array.from(c.repos.entries()).sort((a, b) => b[1] - a[1]);
    lines.push(`#### ${idx + 1}. [${mdEscape(c.login)}](${c.htmlUrl})`);
    lines.push(`Total commits: **${c.totalCommits}**`);
    lines.push("");
    for (const [repoName, commits] of repoEntries) {
      lines.push(`- ${mdEscape(repoName)}: ${commits}`);
    }
    lines.push("");
  }

  const outPath = path.join(REPO_ROOT, output);
  await fs.writeFile(outPath, `${lines.join("\n")}\n`, "utf8");
  console.error(`Wrote ${outPath}`);
  console.error(`Search total: ${searchTotal}; monthly sum: ${sumMonthly}; contributors: ${ranked.length}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
