## Update Contributors.md

To generate or refresh `Contributors.md`:

1. Create `.env` in `.github` with:
   - `GITHUB_TOKEN=your_github_token`
   - Public org repos: any GitHub account token works (no org membership required).
   - Private org repos: token owner must have access to those repos (usually org member/collaborator with read access).
2. Run from `.github` folder:
   - `npx tsx contributors.ts --org HyperlinksSpace --out Contributors.md`