// Run from `.github`: npx tsx scripts/contributors.ts --org HyperlinksSpace --out Contributors.md

import * as fs from "node:fs/promises";
import * as path from "node:path";

type GithubRepo = {
  name: string;
  full_name: string;
  archived: boolean;
  fork: boolean;
};

type GithubContributor = {
  login: string;
  html_url: string;
  contributions: number;
};

type ContributorSummary = {
  login: string;
  htmlUrl: string;
  totalCommits: number;
  repos: Map<string, number>;
};

const API_BASE = "https://api.github.com";

function stripWrappingQuotes(value: string): string {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  return value;
}

const DOTENV_OVERRIDE_KEYS = new Set(["GITHUB_TOKEN"]);

async function loadDotEnv(): Promise<void> {
  const envPath = path.resolve(process.cwd(), ".env");

  let raw = "";
  try {
    raw = (await fs.readFile(envPath, "utf8")).replace(/^\uFEFF/u, "");
  } catch {
    return;
  }

  for (const originalLine of raw.split(/\r?\n/u)) {
    const line = originalLine.trim();
    if (!line || line.startsWith("#")) continue;

    const eqIndex = line.indexOf("=");
    if (eqIndex <= 0) continue;

    const key = line.slice(0, eqIndex).trim();
    const value = stripWrappingQuotes(line.slice(eqIndex + 1).trim());

    if (!key) continue;
    const override = DOTENV_OVERRIDE_KEYS.has(key) && value.length > 0;
    if (override || !Object.prototype.hasOwnProperty.call(process.env, key)) {
      process.env[key] = value;
    }
  }
}

function parseArgs(argv: string[]) {
  const args = argv.slice(2);
  let org = "";
  let output = "Contributors.md";
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

async function githubRequest<T>(url: string, token: string): Promise<T> {
  const response = await fetch(url, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "contributors-report-script",
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`GitHub API ${response.status} for ${url}\n${body}`);
  }

  return (await response.json()) as T;
}

async function fetchPaginated<T>(url: string, token: string): Promise<T[]> {
  const all: T[] = [];
  let page = 1;
  const perPage = 100;

  while (true) {
    const pageUrl = `${url}${url.includes("?") ? "&" : "?"}per_page=${perPage}&page=${page}`;
    const chunk = await githubRequest<T[]>(pageUrl, token);
    if (chunk.length === 0) break;
    all.push(...chunk);
    if (chunk.length < perPage) break;
    page += 1;
  }

  return all;
}

function mdEscape(text: string): string {
  return text.replaceAll("|", "\\|");
}

async function main() {
  await loadDotEnv();
  const { org, output, includeForks, includeArchived } = parseArgs(process.argv);
  const githubToken = process.env.GITHUB_TOKEN;

  if (!org) {
    throw new Error("Missing --org argument. Example: --org HyperlinksSpace");
  }
  if (!githubToken) {
    throw new Error("Missing GITHUB_TOKEN env var.");
  }

  console.log(`Fetching repos for org: ${org}`);
  const repos = await fetchPaginated<GithubRepo>(`${API_BASE}/orgs/${org}/repos?type=all`, githubToken);

  const filteredRepos = repos.filter((r) => {
    if (!includeForks && r.fork) return false;
    if (!includeArchived && r.archived) return false;
    return true;
  });

  console.log(`Found ${filteredRepos.length} repositories to scan`);

  const contributors = new Map<string, ContributorSummary>();

  for (const repo of filteredRepos) {
    const repoContributors = await fetchPaginated<GithubContributor>(
      `${API_BASE}/repos/${repo.full_name}/contributors?anon=0`,
      githubToken
    ).catch((err) => {
      console.warn(`Skipping ${repo.full_name}: ${String(err)}`);
      return [];
    });

    for (const c of repoContributors) {
      const existing =
        contributors.get(c.login) ??
        ({
          login: c.login,
          htmlUrl: c.html_url,
          totalCommits: 0,
          repos: new Map<string, number>(),
        } satisfies ContributorSummary);

      existing.totalCommits += c.contributions;
      existing.repos.set(repo.name, (existing.repos.get(repo.name) ?? 0) + c.contributions);
      contributors.set(c.login, existing);
    }
  }

  const ranked = Array.from(contributors.values()).sort((a, b) => b.totalCommits - a.totalCommits);
  console.log(`Contributors found: ${ranked.length}`);

  const lines: string[] = [];
  lines.push(`# Organization contributors report: ${org}`);
  lines.push("");
  lines.push(`Generated at: ${new Date().toISOString()}`);
  lines.push(`Repositories scanned: ${filteredRepos.length}`);
  lines.push(`Contributors: ${ranked.length}`);
  lines.push("");
  lines.push("## Ranking");
  lines.push("");
  lines.push("| Rank | Contributor | Total commits | Profile |");
  lines.push("| ---: | --- | ---: | --- |");
  for (let idx = 0; idx < ranked.length; idx += 1) {
    const c = ranked[idx];
    lines.push(`| ${idx + 1} | ${mdEscape(c.login)} | ${c.totalCommits} | [${mdEscape(c.htmlUrl)}](${c.htmlUrl}) |`);
  }

  lines.push("");
  lines.push("## Per-contributor repository breakdown");
  lines.push("");

  for (let idx = 0; idx < ranked.length; idx += 1) {
    const c = ranked[idx];
    const repoEntries = Array.from(c.repos.entries()).sort((a, b) => b[1] - a[1]);
    lines.push(`### ${idx + 1}. [${mdEscape(c.login)}](${c.htmlUrl})`);
    lines.push(`Total commits: **${c.totalCommits}**`);
    lines.push("");
    for (const [repoName, commits] of repoEntries) {
      lines.push(`- ${mdEscape(repoName)}: ${commits}`);
    }
    lines.push("");
  }

  const bytes = `${lines.join("\n")}\n`;
  const outPath = path.resolve(process.cwd(), output);
  await fs.writeFile(outPath, bytes);
  console.log(`Markdown written: ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
