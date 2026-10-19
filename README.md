# job-portfolio

Personal portfolio site for job hunting. It shows projects, experience and skills. Built with Astro and Tailwind CSS, and deployed to `arjun.buzz`.

**Status:** M4 (home page and case study template; images and real case-study text pending). The component preview lives at `/styleguide`; run `SHOW_DRAFTS=true pnpm build` to include unapproved content. See [`docs/DESIGN.md`](docs/DESIGN.md) for the stack, information architecture, visual design, content contract and launch checks.

## Development

Requires Node 22.22+ and pnpm (the version is pinned in `package.json`; `corepack enable` picks it up).

```sh
pnpm install
pnpm dev            # http://localhost:4321
```

| Command                             | What it does                                                           |
| ----------------------------------- | ---------------------------------------------------------------------- |
| `pnpm build`                        | Production build to `dist/`                                            |
| `pnpm preview`                      | Serve the production build                                             |
| `pnpm check`                        | Astro and TypeScript type checks                                       |
| `pnpm lint`                         | ESLint                                                                 |
| `pnpm format` / `pnpm format:check` | Prettier                                                               |
| `pnpm test:unit`                    | Vitest unit tests, including the colour contrast checks                |
| `pnpm test:e2e`                     | Playwright tests against the production build (run `pnpm build` first) |
| `pnpm lhci`                         | Lighthouse CI budgets against the production build (docs/DESIGN.md §7) |

CI (`.github/workflows/ci.yml`) runs all of these on every pull request and on pushes to `main`.

To use an existing Chromium for local Playwright runs, set `PW_CHROMIUM_PATH` to its executable.
