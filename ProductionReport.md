# HyperlinksSpace — production & contributors (GitHub API)

Generated at: 2026-05-03T15:59:54.564Z

## Production dynamics

Commit totals use the [GitHub Commit Search API](https://docs.github.com/en/rest/search/search#search-commits) with a dummy term (`NOT doesnotexist12345`) so the query is not qualifiers-only. **Contributors** per month are **distinct GitHub `author` logins** returned by commit search for that month’s `committer-date` range (see note below if a month exceeds 1000 indexed commits).

| Metric | Value |
| --- | ---: |
| Organization | `HyperlinksSpace` |
| **Total commits (org search)** | **2276** |
| Sum of monthly commit counts (2022-01–2026-05 (Current)) | 2276 |
| Contributor commit sum, non-fork non-archived repos (81 repos) | 2248 |

### Chart

Vector: [`images/commits-by-month.svg`](images/commits-by-month.svg) · Raster: [`images/commits-by-month.png`](images/commits-by-month.png). **Y-axis** starts at **0**. **Bar colors** run red → green by commit volume within the chart range. On **GitHub**, the chart image below uses an absolute `raw` URL so it renders like other org assets. For local preview, open [`images/commits-by-month.png`](images/commits-by-month.png).

![Commits by month — production chart](https://github.com/HyperlinksSpace/.github/raw/main/images/commits-by-month.png)

### Monthly breakdown (UTC) — measurement UTC date **2026-05-03** · full timestamp `2026-05-03T15:57:04.388Z`

**(Current)** on the last row means the UTC calendar month was still in progress at measurement time (counts include only commits through that UTC date, same as the chart).

`*` = that month has more than **1000** commits in GitHub search; only the first 1000 results are available, so **contributor count may be understated** (distinct authors in the sample).

| Month (UTC) | Commits | Contributors | Bar (scaled) |
| --- | ---: | ---: | --- |
| 2022-01 | 0 | 0 | `····························` |
| 2022-02 | 0 | 0 | `····························` |
| 2022-03 | 0 | 0 | `····························` |
| 2022-04 | 0 | 0 | `····························` |
| 2022-05 | 10 | 1 | `█···························` |
| 2022-06 | 5 | 1 | `····························` |
| 2022-07 | 2 | 1 | `····························` |
| 2022-08 | 0 | 0 | `····························` |
| 2022-09 | 9 | 1 | `█···························` |
| 2022-10 | 19 | 1 | `█···························` |
| 2022-11 | 42 | 1 | `███·························` |
| 2022-12 | 2 | 1 | `····························` |
| 2023-01 | 2 | 1 | `····························` |
| 2023-02 | 47 | 2 | `███·························` |
| 2023-03 | 27 | 2 | `██··························` |
| 2023-04 | 8 | 1 | `█···························` |
| 2023-05 | 10 | 2 | `█···························` |
| 2023-06 | 6 | 2 | `····························` |
| 2023-07 | 24 | 1 | `██··························` |
| 2023-08 | 22 | 3 | `██··························` |
| 2023-09 | 25 | 5 | `██··························` |
| 2023-10 | 53 | 4 | `████························` |
| 2023-11 | 4 | 2 | `····························` |
| 2023-12 | 19 | 3 | `█···························` |
| 2024-01 | 51 | 4 | `████························` |
| 2024-02 | 147 | 7 | `███████████·················` |
| 2024-03 | 160 | 6 | `████████████················` |
| 2024-04 | 49 | 4 | `████························` |
| 2024-05 | 17 | 3 | `█···························` |
| 2024-06 | 0 | 0 | `····························` |
| 2024-07 | 56 | 3 | `████························` |
| 2024-08 | 44 | 1 | `███·························` |
| 2024-09 | 58 | 2 | `████························` |
| 2024-10 | 4 | 1 | `····························` |
| 2024-11 | 4 | 1 | `····························` |
| 2024-12 | 4 | 2 | `····························` |
| 2025-01 | 0 | 0 | `····························` |
| 2025-02 | 2 | 1 | `····························` |
| 2025-03 | 3 | 1 | `····························` |
| 2025-04 | 0 | 0 | `····························` |
| 2025-05 | 6 | 2 | `····························` |
| 2025-06 | 0 | 0 | `····························` |
| 2025-07 | 3 | 1 | `····························` |
| 2025-08 | 12 | 1 | `█···························` |
| 2025-09 | 58 | 1 | `████························` |
| 2025-10 | 80 | 2 | `██████······················` |
| 2025-11 | 88 | 2 | `██████······················` |
| 2025-12 | 98 | 1 | `███████·····················` |
| 2026-01 | 47 | 1 | `███·························` |
| 2026-02 | 256 | 2 | `███████████████████·········` |
| 2026-03 | 287 | 2 | `█████████████████████·······` |
| 2026-04 | 386 | 1 | `████████████████████████████` |
| 2026-05 (Current) | 20 | 1 | `█···························` |

## Contributors

Per-repository contributor counts from [`GET /repos/{owner}/{repo}/contributors`](https://docs.github.com/en/rest/collaborators/collaborators#list-repository-contributors) (same rules as `scripts/contributors.ts`: forks and archived repos excluded unless flags are used).

Repositories scanned: **81** · Unique contributors: **22**

### Ranking

| Rank | Contributor | Total commits | Profile |
| ---: | --- | ---: | --- |
| 1 | anriltine | 1632 | [https://github.com/anriltine](https://github.com/anriltine) |
| 2 | justdmitry | 129 | [https://github.com/justdmitry](https://github.com/justdmitry) |
| 3 | Dhereal1 | 102 | [https://github.com/Dhereal1](https://github.com/Dhereal1) |
| 4 | alerdenisov | 76 | [https://github.com/alerdenisov](https://github.com/alerdenisov) |
| 5 | itechunter | 71 | [https://github.com/itechunter](https://github.com/itechunter) |
| 6 | liminalAngel | 70 | [https://github.com/liminalAngel](https://github.com/liminalAngel) |
| 7 | vadimilyano | 30 | [https://github.com/vadimilyano](https://github.com/vadimilyano) |
| 8 | aSpite | 29 | [https://github.com/aSpite](https://github.com/aSpite) |
| 9 | SobeitB | 26 | [https://github.com/SobeitB](https://github.com/SobeitB) |
| 10 | sijuz | 25 | [https://github.com/sijuz](https://github.com/sijuz) |
| 11 | anovic123 | 10 | [https://github.com/anovic123](https://github.com/anovic123) |
| 12 | thebatclaudio | 9 | [https://github.com/thebatclaudio](https://github.com/thebatclaudio) |
| 13 | okti-web | 7 | [https://github.com/okti-web](https://github.com/okti-web) |
| 14 | Adrevolution | 6 | [https://github.com/Adrevolution](https://github.com/Adrevolution) |
| 15 | kuhel | 5 | [https://github.com/kuhel](https://github.com/kuhel) |
| 16 | nxrix | 5 | [https://github.com/nxrix](https://github.com/nxrix) |
| 17 | shibdev | 4 | [https://github.com/shibdev](https://github.com/shibdev) |
| 18 | xykylikuf001 | 4 | [https://github.com/xykylikuf001](https://github.com/xykylikuf001) |
| 19 | pyAndr3w | 3 | [https://github.com/pyAndr3w](https://github.com/pyAndr3w) |
| 20 | albertincx | 2 | [https://github.com/albertincx](https://github.com/albertincx) |
| 21 | printdreams | 2 | [https://github.com/printdreams](https://github.com/printdreams) |
| 22 | Gusarich | 1 | [https://github.com/Gusarich](https://github.com/Gusarich) |

### Per-contributor repository breakdown

#### 1. [anriltine](https://github.com/anriltine)
Total commits: **1632**

- HyperlinksSpaceProgram: 878
- whatswap: 119
- TinyModel: 107
- a-dao: 98
- payments_counter: 42
- HyperlinksSpaceWebsite: 30
- ton-editable-minter: 27
- FastTonTradeBot: 26
- ton-dictionaries-template: 23
- BlockchainProgram: 21
- .github: 20
- a-tdp-template: 19
- FUNK: 19
- x2lottery: 14
- a-tokenized-freelance-exchange: 13
- hello-frontend: 13
- HyperlinksSpaceProgramLanding: 13
- ton-nft-dapp: 12
- a-careers-smc: 10
- TON_add_number_contract: 9
- freelance-exchange-tdb: 9
- desde: 9
- nft_deposits_collection: 8
- cryptocash-v0: 7
- heads-or-tails: 7
- TECHSYNBAL.COM: 7
- a-careers-frontend: 5
- hex-swap: 5
- swap-jetton: 5
- pump-jetton: 4
- STUN: 4
- TON_proxy_smart: 3
- custom-sale-contract: 3
- a-explorer: 3
- ton-multisender: 3
- some-tma-template: 3
- ton_save_addresses_smart: 2
- world2040: 2
- UniversalMultiSender: 2
- rock-paper-scissors-draft: 2
- a-ico: 2
- a-careers-manifest: 2
- pc-manifest: 2
- fastton: 2
- TON_smart_contract_hello_world: 1
- proxy_generator: 1
- n-minter: 1
- send-fift-to-addr: 1
- a-market-smc: 1
- a-careers-smc-beta: 1
- website: 1
- clicker-backend: 1
- ton-router: 1
- dice: 1
- captains-bay: 1
- public_assets: 1
- diaverse: 1
- 0: 1
- GiftBet: 1
- TKR3TK: 1
- big_bang_animation: 1
- UnityHelloWorld: 1

#### 2. [justdmitry](https://github.com/justdmitry)
Total commits: **129**

- a-careers-api: 128
- a-wallet-api: 1

#### 3. [Dhereal1](https://github.com/Dhereal1)
Total commits: **102**

- HyperlinksSpaceProgram: 102

#### 4. [alerdenisov](https://github.com/alerdenisov)
Total commits: **76**

- clicker-backend: 43
- a-clicker: 33

#### 5. [itechunter](https://github.com/itechunter)
Total commits: **71**

- a-careers-frontend: 45
- swap-front: 23
- swap-bot: 2
- a-careers-bot: 1

#### 6. [liminalAngel](https://github.com/liminalAngel)
Total commits: **70**

- BlockchainProgram: 32
- a-tdp-template: 28
- a-tokenized-freelance-exchange: 5
- freelance-exchange-tdb: 3
- a-dao: 2

#### 7. [vadimilyano](https://github.com/vadimilyano)
Total commits: **30**

- FUNK: 23
- cc-clicker-full: 4
- captains-bay: 2
- cc-clicker: 1

#### 8. [aSpite](https://github.com/aSpite)
Total commits: **29**

- a-careers-smc: 21
- a-tokenized-freelance-exchange: 4
- freelance-exchange-tdb: 4

#### 9. [SobeitB](https://github.com/SobeitB)
Total commits: **26**

- a-careers-frontend: 26

#### 10. [sijuz](https://github.com/sijuz)
Total commits: **25**

- a-careers-bot: 25

#### 11. [anovic123](https://github.com/anovic123)
Total commits: **10**

- a-careers-landing: 10

#### 12. [thebatclaudio](https://github.com/thebatclaudio)
Total commits: **9**

- x2lottery: 9

#### 13. [okti-web](https://github.com/okti-web)
Total commits: **7**

- ton-callboard: 7

#### 14. [Adrevolution](https://github.com/Adrevolution)
Total commits: **6**

- aWallet: 6

#### 15. [kuhel](https://github.com/kuhel)
Total commits: **5**

- a-clicker: 5

#### 16. [nxrix](https://github.com/nxrix)
Total commits: **5**

- a-explorer: 5

#### 17. [shibdev](https://github.com/shibdev)
Total commits: **4**

- a-dao: 3
- a-careers-smc: 1

#### 18. [xykylikuf001](https://github.com/xykylikuf001)
Total commits: **4**

- a-wallet-frontend: 4

#### 19. [pyAndr3w](https://github.com/pyAndr3w)
Total commits: **3**

- a-careers-smc: 3

#### 20. [albertincx](https://github.com/albertincx)
Total commits: **2**

- a-careers-frontend: 2

#### 21. [printdreams](https://github.com/printdreams)
Total commits: **2**

- cryptocash-v0: 2

#### 22. [Gusarich](https://github.com/Gusarich)
Total commits: **1**

- a-careers-smc: 1

