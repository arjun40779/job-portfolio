# Portfolio Site: Design Doc

| | |
|---|---|
| **Author** | Arjun Singh |
| **Status** | Revision 3: review feedback addressed, ready to build (M1) |
| **Last updated** | 2026-10-19 |
| **Domain** | `arjun.buzz` (root) |

### Revision history

| Rev | Changes |
|---|---|
| 1 | Initial draft (Next.js) |
| 2 | Review decisions: **Astro**, Apple's web palette, **email link only**, **root domain**, placeholders for missing assets, content from the resume |
| 3 | **Review round 2:** project evidence moved up the page (§3); left-aligned hero with real work (§4.2); claims register (§5.4); colour contrast fixed, with separate button tokens (§4.3); interaction scope defined, with `ClientRouter` dropped (§2.1); performance test conditions made reproducible (§7); content contract completed (§5.6); launch acceptance checks and publication gates added (§8); tag filtering deferred; skills cut to 3 groups; header simplified; fewer background bands |
| 3.1 | **M3 build notes:** content contract now points at `src/content.config.ts` as the source of truth (§5.6) and adds `caseStudyApproved`, `clientOrder` and profile fields; a separate gate for the Pexit card versus its case study (§8.2); reveal-on-scroll safety nets made precise (§2.1) |
| 3.2 | **M4 build notes:** `placeholderContent` flag keeps invented case-study text out of production (§5.6, §8.2); CI tests both a production and a draft build, and Lighthouse runs on the draft build so case study routes are measured (§7.1); `/projects` index still deferred (§3) |
| 3.3 | **M5 build notes:** real PGSinKokrajhar screenshot; Pexit architecture diagram; separate `coverApproved` and `diagramApproved` gates for employer media (§5.6, §8.2); images optimised to AVIF/WebP by sharp |
| 3.4 | **M6 build notes:** Open Graph images generated at build; `ProfilePage` JSON-LD; hash-based CSP via Astro `security.csp`; `vercel.json` security and cache headers; `pnpm launch:check` reports open publication gates (§8.2, §8.4) |

---

## 1. Goals

The site is a job-hunting tool. A recruiter or hiring manager should be able to answer three questions within about 30 seconds:

1. **What has this person built?** Real projects, each showing *what I personally built* and *what improved*. This is the main thing the site has to deliver.
2. **Who is this?** Arjun Singh, Full-Stack Software Engineer, India (open to relocation or remote), open to work.
3. **How do I reach them?** Résumé and email, one click away from every page.

### Success criteria

- The first screen shows real work (a project screenshot) and the **View my work** and **Résumé** actions.
- From any page, the Résumé is reachable in **one click** (header) and email in **one click** (footer and contact section).
- Every featured project states the **problem, my contribution, the key decision, and the outcome**. Any number on the site is backed by a measurement or replaced with a concrete description (§5.4).
- The performance and accessibility budgets in §7 pass in CI under the stated test conditions.
- Adding a project or job means editing **one content file**, with no component changes.

### Non-goals (v1)

- Blog or CMS.
- Contact form or any backend. Email link only.
- **Project tag filtering.** With 3 case studies it adds behaviour without much value. Revisit at 6+ projects.
- Multiple languages.

---

## 2. Tech stack

| Concern | Choice | Why |
|---|---|---|
| Framework | **Astro** (latest stable at kickoff, pinned), static output | A content site needs almost no client JS. Astro ships zero JS by default. |
| Language | **TypeScript** (strict) | Typed content and props. |
| Styling | **Tailwind CSS v4** (via `@tailwindcss/vite`) | Design tokens as CSS variables in `@theme`, simple dark mode, no styling runtime. |
| Content | **Astro Content Collections** (`file()` and `glob()` loaders, Zod schemas) + **MDX** (`@astrojs/mdx`) | Validated at build time and reviewed in PRs (§5.6). |
| Interactivity | Plain TypeScript `<script>` modules (§2.1) | Three small behaviours don't justify a UI framework. |
| Page transitions | **Native cross-document View Transitions** (CSS `@view-transition { navigation: auto; }`), **no `ClientRouter`** | Zero JS, and every page load is a normal document load, so scripts never need re-initialising after client-side navigation. Browsers without support just navigate normally. |
| Icons | **astro-icon** with `@iconify-json/lucide` and `@iconify-json/simple-icons` | Inlined as SVG at build time. No icon JS. |
| Fonts | Apple system stack first, then **Inter Variable** (`@fontsource-variable/inter`, self-hosted, **not preloaded**) | See §7.3. Apple devices never download Inter. |
| SEO | `@astrojs/sitemap`, per-page meta and Open Graph tags, **JSON-LD `Person`** (`ProfilePage`), OG images generated at build (satori + @resvg/resvg-js) | Structured data **helps search engines understand the profile**. It doesn't guarantee any special search result. |
| Images | Astro `<Image />` / `<Picture />` (`astro:assets`), AVIF/WebP, explicit dimensions | No layout shift. |
| Analytics | **None** for v1 | Can be added later without design changes. |
| Lint and format | ESLint (`eslint-plugin-astro`), Prettier (`prettier-plugin-astro`, `prettier-plugin-tailwindcss`), `astro check` | |
| Testing | **Playwright** (E2E + `@axe-core/playwright`), **Lighthouse CI** | §7, §8 |
| CI/CD | **GitHub Actions** (check, lint, build, test, Lighthouse) to **Vercel** (preview per PR, production on `main`) | |
| Package manager | **pnpm** | |

### 2.1 Interaction inventory

This is the complete list of client-side behaviour. Anything not listed here ships as static HTML/CSS.

| # | Behaviour | JS? | Without JS / on failure | Notes |
|---|---|---|---|---|
| 1 | **Theme toggle** (light / dark / system) | Inline `<head>` script (~0.5 KB) + toggle handler | Follows the OS setting via `prefers-color-scheme`. The toggle button is rendered `hidden` and only shown by the script. | The choice is stored in `localStorage` (wrapped in try/catch) and applied before first paint on every page load. |
| 2 | **Copy email** button | Yes | The button stays `hidden`. The `mailto:` link and the visible email text always work. | Shown only when `navigator.clipboard` exists. On success: "Email copied" through an `aria-live="polite"` region. On failure: "Couldn't copy. Email: arjun40779@gmail.com". |
| 3 | **Reveal on scroll** | Yes (`IntersectionObserver`) | **All content is visible.** The hidden starting state only applies under `html.js` (set by the head script) and when `prefers-reduced-motion: no-preference`. | Content is never hidden from crawlers or for a failed script. Safety nets: a CSS-only animation reveals everything after 2s if the reveal script never runs; if `IntersectionObserver` is missing, or hasn't reported within 1.5s, everything is revealed at once. |
| — | Page transitions | No (CSS only) | Normal navigation | Native View Transitions. |
| — | Navigation | No | — | **No mobile menu.** The header has only 3 links plus Résumé, so it fits a 320px screen without one (§4.2). That removes a focus trap and its script. |

**Script structure:** each behaviour is an `init*()` function that finds its elements with `data-*` attributes, binds once (it is idempotent, guarded by `data-bound`), and runs on `DOMContentLoaded`. We don't use `ClientRouter`, so `astro:page-load` isn't needed. If we ever add `ClientRouter`, the same `init*()` functions get registered on `astro:page-load` instead, and the E2E suite (§8) already covers navigating between pages, not only direct loads.

---

## 3. Information architecture

```
/                     Home
/projects/[slug]      Case study (MDX): Pexit, PGSinKokrajhar, HorizonVision Group
/resume.pdf           Static file (publication gate §8.2)
/404                  Custom not-found page
```

There is no separate `/projects` index page in v1. Every project is reachable from the home page, and a list page returns together with filtering when the project count grows.

### Home page, in order

The evidence comes first, then the context.

1. **Header (sticky, translucent):** "Arjun Singh" wordmark (links to `/`), links **Work · Experience · About**, **Résumé** pill button, theme toggle.
2. **Hero (left-aligned):** name, value statement, CTAs **View my work** (to `#work`) and **Résumé**. GitHub, LinkedIn and email icon links. A **project screenshot** on the right (§4.2).
3. **Featured work** `#work` (on `--surface`): **Pexit as a large card**, then **PGSinKokrajhar** and **HorizonVision Group** as two smaller cards. Each card shows a screenshot or diagram, **my contribution**, and **one concrete outcome**. Tech tags are secondary. Below the cards is a compact **Client work** list.
4. **Experience** `#experience`: a timeline of 4 roles, each with its top 2–3 *action + result* bullets. Then Education.
5. **About** `#about`: a short personal paragraph about *the problems I enjoy solving* (written by Arjun, §5.1), quick facts, and **compact skills** in 3 groups (§5.3).
6. **Contact** `#contact` (on `--surface`): *"Let's work together."*, the email as a large link, a copy button, and GitHub and LinkedIn.
7. **Footer (every page):** email link, GitHub, LinkedIn, Résumé, © year, "Built with Astro", source link.

### Case study template (`/projects/[slug]`)

1. **Visual opening:** title, one-line summary, and a large screenshot. For private work, a **permitted architecture diagram** instead (§8.2).
2. **Facts row:** **Role · Team · Timeline · Scope** (for example *Full-stack engineer · Team of N · Jul 2026 – present · Auth, social graph, feed*).
3. **Problem:** what existed and why it mattered.
4. **What I built:** my personal contribution, separated from the team's.
5. **Key decisions:** 2–3 decisions, each with the alternatives considered and why this one won.
6. **Results:** measured outcomes per §5.4, or concrete before/after descriptions.
7. **Stack and links**, then "Next project ›" and "← Back to work" (`/#work`).

---

## 4. Visual design

Restrained and inspired by **apple.com**: generous white space, confident type, near-black on white, one blue for interaction, pill buttons, "›" text links. The **distinctive identity comes from Arjun's own screenshots, diagrams, captions and writing**, not decoration. We borrow Apple's visual language only, not its logos, imagery or layouts.

### 4.1 Principles

- **Work at the centre.** Screenshots and outcomes before skill lists.
- **One accent colour**, used only for interaction.
- **Content visible immediately.** Motion is a small finishing touch and never gates reading.
- **Calm, continuous flow.** Mostly one background. The contrasting surface is reserved for Featured work and Contact.

### 4.2 Layout and grid

- Max content width **980px**, centred. Prose width at most **68ch**.
- 12-column grid on desktop, 1 column on mobile. Gutters: 16px on mobile, 24px on tablet, 32px on desktop.
- Background: `--bg` for most sections, separated by a hairline divider. **Only Featured work and Contact sit on `--surface`.**
- Section vertical padding: 96px on desktop, 64px on mobile.
- Breakpoints (Tailwind defaults), mobile-first, tested down to **320px**.

**Hero (desktop, left-aligned)**

```
┌──────────────────────────────────────────────────────────────────────┐
│ Arjun Singh                 Work  Experience  About  ( Résumé )  ◐   │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ● Open to work                       ┌──────────────────────────┐   │
│  Arjun Singh                          │                          │   │
│  Full-stack engineer building         │   Pexit feed screenshot  │   │
│  production web applications.         │   (or architecture       │   │
│                                       │    diagram if private)   │   │
│  From Fastify APIs and PostgreSQL     │                          │   │
│  to React interfaces.                 └──────────────────────────┘   │
│                                         caption: "Pexit: feed & graph"│
│  ( View my work )   Résumé ›                                         │
│  GitHub · LinkedIn · Email                                           │
└──────────────────────────────────────────────────────────────────────┘
```

On mobile the text comes first, then the image. Until a permitted image exists, the slot shows the PGSinKokrajhar screenshot, which is public work. No portrait is needed.

**Header on mobile (320px):** wordmark and theme toggle on row 1; `Work · Experience · About · Résumé` on row 2. No menu.

**Featured work**

```
┌───────────────────────────────────────────────────────────────┐
│  ┌─────────────────────────────┐  Pexit                       │
│  │                             │  Professional networking     │
│  │    screenshot / diagram     │  platform                    │
│  │                             │  I built: auth system, Neo4j │
│  └─────────────────────────────┘  social graph, feed module   │
│                                    Outcome: <per §5.4>        │
│                                    Fastify · Postgres · Neo4j │
│                                    Read case study ›          │
├───────────────────────────────┬───────────────────────────────┤
│ [screenshot]                  │ [screenshot]                  │
│ PGSinKokrajhar                │ HorizonVision Group           │
│ I built: the whole product…   │ I built: CMS model + site…    │
│ Outcome: …                    │ Outcome: …                    │
│ Visit ↗   Case study ›        │ Visit ↗   Case study ›        │
└───────────────────────────────┴───────────────────────────────┘
  Client work (agency teams): FTI Consulting ↗ · Altudo ↗ · Kohler Health ↗ · W5 Engineering ↗
```

### 4.3 Colour tokens

Based on apple.com's colours. Contrast ratios were **calculated** (WCAG 2.x relative luminance). Requirements: 4.5:1 for normal text; 3:1 for large text, control boundaries and focus indicators.

**Surfaces and text**

| Token | Light | Dark | Measured |
|---|---|---|---|
| `--bg` | `#FFFFFF` | `#000000` | |
| `--surface` | `#F5F5F7` | `#161617` | |
| `--text` | `#1D1D1F` | `#F5F5F7` | 15.5:1 on surface (L) · 16.6:1 (D) |
| `--text-muted` | `#6E6E73` | `#A1A1A6` | 5.07 on bg / 4.66 on surface (L) · 8.16 / 7.03 (D) |
| `--divider` | `#D2D2D7` | `#424245` | **Decorative only** (1.5:1 / 2.1:1). Never the only boundary of a control. |
| `--control-border` | `#86868B` | `#86868B` | 3.62 on bg / 3.33 on surface (L) · 5.80 / 4.99 (D): boundaries for outlined controls (theme toggle, copy button, secondary buttons) |

**Links (text)**

| Token | Light | Dark | Measured |
|---|---|---|---|
| `--link` | `#0066CC` | `#2997FF` | 5.57 on bg / 5.11 on surface (L) · 6.96 / 6.00 (D) |
| `--link-hover` | `#0066CC` + underline | `#47A6FF` + underline | Hover adds an underline, so it doesn't rely on colour alone |

`#0071E3` text on `#F5F5F7` is only **4.31:1**, so it's **not** used for text links. Links use Apple's `#0066CC` instead.

**Primary (filled) button: separate tokens, same in both themes**

| Token | Value | White text contrast |
|---|---|---|
| `--btn-primary-bg` | `#0071E3` | **4.70:1** ✓ |
| `--btn-primary-bg-hover` | `#0062C4` | **5.93:1** ✓ (the earlier `#0077ED` was 4.32:1 ✗, now replaced) |
| `--btn-primary-bg-active` | `#005BB5` | **6.64:1** ✓ |
| `--btn-primary-fg` | `#FFFFFF` | |

The filled button's boundary is its own fill against the page: `#0071E3` against `#FFFFFF` is 4.70 and against `#000000` is 4.47, both at least 3:1.

**Other**

| Token | Light | Dark | Measured |
|---|---|---|---|
| `--focus-ring` | `#0071E3` | `#2997FF` | 4.70 on white · 6.96 on black (2px ring, 2px offset) |
| `--success` | `#1D8A3A` | `#30D158` | 4.42 / 4.06 (L) · 10.4 (D). Used for the dot only, **always paired with the text "Open to work"** in `--text`. |
| `--header-bg` | `rgb(255 255 255 / 0.72)` | `rgb(22 22 23 / 0.72)` | With `backdrop-filter: saturate(180%) blur(20px)`. Text sits on the blurred surface. Checked against the worst case in E2E. |

A unit test recomputes every pair in this section from the token file, so changing a token can't silently break contrast.

### 4.4 Typography

```css
--font-sans: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text",
             "Inter Variable", "Helvetica Neue", Helvetica, Arial, sans-serif;
--font-mono: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
```

| Role | Size (mobile → desktop) | Weight | Line height / tracking |
|---|---|---|---|
| Display (hero name) | 44 → 72px | 600 | 1.05 / -0.015em |
| Hero statement | 22 → 28px | 500 | 1.25 / -0.01em |
| H2 (section) | 32 → 44px | 600 | 1.1 / -0.01em |
| H3 (card) | 19 → 24px (Pexit card: 28px) | 600 | 1.25 |
| Body | 17px | 400 | 1.5 |
| Small / meta / captions | 14px | 400 | 1.43 |
| Tag | 12px | 500 | 1, mono |

Font sizes scale fluidly with `clamp()`.

### 4.5 Spacing, radius, elevation

- 4px spacing scale. Radius: **18px** for cards, pill shape for buttons and tags.
- Flat by default. On hover, a card's image scales to 1.02 and the card gains `0 4px 24px rgb(0 0 0 / 0.08)`. Disabled under `prefers-reduced-motion`.

### 4.6 Components (Astro)

`Header` · `Footer` · `Button` (filled / outlined / text ›) · `Tag` · `FeaturedProjectCard` (size: `lg` / `md`) · `ClientWorkList` · `TimelineItem` · `SkillGroup` · `SectionHeading` · `FactsRow` · `Figure` (image + caption) · `ThemeToggle` · `CopyEmail` · `ExternalLink` (↗, `rel="noopener noreferrer"`, label says "opens in new tab" if `target=_blank`).

### 4.7 Motion

- Reveal: opacity 0 → 1 and an 8px upward move, over 300ms with `cubic-bezier(0.25, 0.1, 0.25, 1)`. Each element animates once, and only per §2.1 #3. **Above-the-fold content (header, hero) never animates.**
- Hover and focus transitions: 200ms.
- Page change: native View Transition cross-fade (200ms).
- `prefers-reduced-motion: reduce` turns off the reveal, hover scaling and view-transition animation.

### 4.8 Accessibility

- Semantic landmarks, a skip link, one `h1` per page, logical heading order.
- Every interactive element is reachable and operable by keyboard, with a visible `--focus-ring`.
- `scroll-margin-top` equals the sticky header height plus 16px on every anchored section, so `#work`, `#experience`, `#about` and `#contact` land with the heading visible, including when arriving from another page (`/#contact`).
- Images have `alt` text, and captions describe what the screenshot shows. Decorative icons are `aria-hidden`.
- Copy feedback is announced through `aria-live`. The theme toggle exposes its state (`aria-pressed` or a labelled radio group).
- Colour is never the only signal. Links inside running text are underlined; standalone links (nav, "›" links, cards) aren't.

---

## 5. Content

All content lives in `src/content/` (§5.6).

### 5.1 Profile

| Field | Value |
|---|---|
| Name | Arjun Singh |
| Value statement | Full-stack engineer building production web applications. |
| Sub-line | From Fastify APIs and PostgreSQL to React interfaces. |
| Location | India · Open to relocation / remote |
| Email | arjun40779@gmail.com |
| GitHub | github.com/arjun40779 |
| LinkedIn | linkedin.com/in/arjun-singh-541554117 |
| Open to work | Yes |
| About paragraph | **Needs Arjun's own words** (3–4 sentences on the problems you enjoy solving). Placeholder until then. |

The phone number never appears on site pages (see also the résumé gate in §8.2).

### 5.2 Experience

Bullets on the site follow §5.4: a metric only where it has evidence, otherwise a concrete description.

| Role | Company | Dates | Site bullets (top 2–3) |
|---|---|---|---|
| Software Engineer, Full Stack | Updot (Pexit) | 2026-07 – present | Rebuilt authentication end to end (split access/refresh JWTs bound to Redis sessions, AES-256-GCM token encryption, OTP and global rate limiting) · Built the Neo4j social-graph module for connections, mutuals and recommendation candidates · Built the Posts/Comments/Feed module (Fastify + Postgres) with its React UI |
| Freelance Frontend Engineer | Self-employed (remote) | 2026-01 – 2026-06 | Delivered two client products end to end: PGSinKokrajhar (booking platform) and HorizonVision Group (CMS-driven site) |
| Software Engineer (Frontend / CMS) | Koru UX Design (JSCAPE MFT SaaS) | 2025-08 – 2025-12 | Led React/Next.js modernisation integrated with Sitecore · Redesigned 20+ enterprise screens *(efficiency claim per §5.4)* |
| Software Engineer (Frontend / CMS & Commerce) | Incero.ai | 2024-03 – 2025-08 | Built Next.js/TypeScript apps on Sitecore, Contentful, Sanity and Strapi · Composable commerce on Sitecore OrderCloud · SSR/ISR and code splitting *(load-time claim per §5.4)* |

**Education:** B.Sc. Computer Science, Gauhati University (2020, CGPA 8.9/10) · Full-Stack Development Program, Coding Ninjas (2026 – present).

### 5.3 Skills (compact, 3 groups)

Key skills link to the project or role where they were used. The full inventory stays in the résumé.

| Group | Key skills (→ evidence) |
|---|---|
| **Backend** | Node.js + Fastify → Pexit · PostgreSQL → Pexit · Neo4j / Cypher → Pexit · Redis → Pexit auth · Supabase → PGSinKokrajhar, Pexit · Auth & security (JWT rotation, RBAC, AES-256-GCM) → Pexit, Incero.ai |
| **Frontend** | React + TypeScript → Pexit, Koru · Next.js → PGSinKokrajhar, Incero.ai · Tailwind CSS · Headless CMS (Sitecore, Contentful, Sanity, Strapi) → Incero.ai, Koru, freelance |
| **Delivery** | Testing (Vitest, Playwright, RTL, MSW) → Pexit · Nx / pnpm monorepos → Pexit · OpenAPI docs → Pexit · Vercel, Cloudflare Workers, AWS, Docker |

### 5.4 Claims register (publication gate)

Every numeric or strong claim needs **what was measured, the baseline, how it was measured, and Arjun's contribution** before it can appear on the site. Without that, the site uses the **fallback wording**, which is still concrete but has no number.

| Claim (from résumé) | Needed to publish as is | Fallback wording if evidence is unavailable | Status |
|---|---|---|---|
| "+25% task efficiency" (Koru, 20+ screens) | Which tasks; how measured (usability test, time-on-task, analytics); before/after values; who measured | "Redesigned 20+ enterprise screens onto a shared, CMS-driven component system for consistent workflows" | ⏳ Needs Arjun |
| "−30% page load time" (Incero.ai) | Which metric (LCP / TTFB / full load), which pages, tool (Lighthouse / RUM), before/after values | "Moved CMS pages to SSR/ISR and split client bundles to cut shipped JavaScript" | ⏳ Needs Arjun |
| "Real-time availability" (PGSinKokrajhar) | The mechanism: Supabase Realtime subscriptions, or availability read live on each request? | Describe the actual mechanism (for example "Availability updates live via Supabase Realtime" or "Availability is read from the database on every request") | ⏳ Needs Arjun |
| Pexit outcomes | Any measurable result (for example latency, test coverage %, modules migrated) and **employer permission** | Scope-based: "Migrated Companies, Profiles, Listings and Posts to a multi-bucket asset service" · "Every backend module documented in OpenAPI and covered by unit + real-Postgres integration tests" | ⏳ Needs Arjun + Updot permission |
| Client work list (FTI, Altudo, Kohler Health, W5) | Confirm what you personally did on each, and that naming the client is allowed | Label as "Contributed to as part of agency teams", with links only | ⏳ Confirm |

### 5.5 Featured projects

| Rank | Project | Ownership | Problem → my contribution → outcome |
|---|---|---|---|
| 1 (large) | **Pexit** | Employer (Updot) | A networking platform needing secure auth, a social graph and feeds → I built the auth rebuild, Neo4j graph and feed module, plus the asset-service migration → outcome per §5.4 |
| 2 | **PGSinKokrajhar** | Freelance client | A PG owner needing online listings and bookings → I built the whole product (Next.js, Sanity, Supabase, role-based auth) → live at pginkokrajhar.com; availability wording per §5.4 |
| 3 | **HorizonVision Group** | Freelance client | An agency needing to edit marketing copy without developers → I built the Sanity content model and the site → copy is now edited in the CMS without code changes |

### 5.6 Content contract

The schemas live in **`src/content.config.ts`**, which is the source of truth (this section summarises it rather than copying it, so the two can't drift). Content files are in `src/content/`:

| File | Shape | Key fields |
|---|---|---|
| `profile.json` | One object keyed by id (`{ "main": { … } }`) | name, title, statement, subline, description, location, experienceSummary, email, openToWork, socials, `resume { path, published }`, about, education[] |
| `experience.json` | Array; each entry has a stable, unique `id` (e.g. `updot-pexit`) | company, product?, role, `start`/`end` as `YYYY-MM` (`end: null` = present, must be ≥ start), 1–3 bullets, tech[], evidence[] |
| `skills.json` | Array of 3 groups with ids `backend` / `frontend` / `delivery` | items[] of `{ name, usedIn[] }` where `usedIn` holds project or experience ids |
| `projects/<slug>.mdx` | id = file name; frontmatter + MDX case study body | title, summary, `ownership` (personal / freelance-client / employer / agency-client), `featuredRank?`, `clientOrder?`, `facts?` (required when featured), contribution, outcome, evidence[], cover? + coverAlt, **`publicationApproved`** (the card), **`caseStudyApproved`** (the case study page), **`placeholderContent`** (body is placeholder text), `coverApproved` (screenshot, default true), `diagram?` + `diagramApproved` (inline diagram for private work), live?, code?, tags[] |

Prominence (`featuredRank`) and ownership are independent: a freelance or employer project can be featured, and agency client work appears in the compact list ordered by `clientOrder`.

Each `evidence` entry records `label`, `value`, `baseline`, `method` and `myRole` (§5.4).

**Rules checked at build** (pure functions in `src/lib/content-rules.ts`, unit tested and applied by `src/lib/content.ts`; any violation fails the build):

- `featuredRank` values are unique and contiguous from 1 **among the projects that ship in that build**. The home page shows the featured projects in rank order. Rank 1 gets the large card.
- Experience is sorted by `start` descending, so the order in the JSON file doesn't matter. At most one entry has `end: null`.
- Every `usedIn` reference resolves to a project id or an experience id.
- In production builds, any project with `publicationApproved: false` is excluded. Draft builds (`astro dev`, Vercel preview deployments, or `SHOW_DRAFTS=true`) show it with a "Draft" badge.
- A featured project gets a case study page in production only when `caseStudyApproved` is true **and** `placeholderContent` is false. Draft builds render every featured case study, marked "Draft".
- A percentage (a digit followed by `%`) in a project's contribution or outcome, or in an experience bullet, fails the build unless that entry has `evidence`.

---

## 6. Project structure

```
job-portfolio/
├─ docs/DESIGN.md
├─ public/                  resume.pdf (gated), favicon.svg, robots.txt
├─ src/
│  ├─ assets/               screenshots, diagrams
│  ├─ components/           Header, Footer, Button, Tag, FeaturedProjectCard, TimelineItem, ...
│  ├─ components/sections/  Hero, FeaturedWork, Experience, About, Contact
│  ├─ content/              profile.json, experience.json, skills.json, projects/*.mdx
│  ├─ content.config.ts
│  ├─ layouts/BaseLayout.astro    meta, JSON-LD, theme head script
│  ├─ lib/                  content.ts (build rules), contrast.ts
│  ├─ scripts/              theme.ts, copy-email.ts, reveal.ts
│  ├─ pages/                index.astro, projects/[slug].astro, 404.astro, og/[slug].png.ts
│  └─ styles/global.css     Tailwind + tokens
├─ tests/                   e2e/*.spec.ts, unit/*.test.ts
├─ .github/workflows/ci.yml
├─ astro.config.mjs
└─ lighthouserc.json
```

---

## 7. Performance and SEO

### 7.1 Test conditions (acceptance testing)

| Parameter | Value |
|---|---|
| Tool | Lighthouse CI (`@lhci/cli`), **mobile preset** (Lighthouse default emulated Moto G Power) |
| Network / CPU throttling | Lighthouse **simulated** throttling: 150 ms RTT, 1.6 Mbps down / 750 Kbps up, **4× CPU slowdown** |
| Cache | **Cold**: a fresh Chrome profile per run, storage cleared |
| Server | `astro preview` in CI, serving the **draft build** (`SHOW_DRAFTS=true`), which is the production build plus draft pages, so case study routes are measured before they ship; repeated against the Vercel preview URL before launch |
| Routes | `/`, `/projects/pexit/`, `/projects/pginkokrajhar/`. `/404` is checked by axe and E2E instead, because Lighthouse marks down any page served with a 404 status. |
| Runs | **5 runs per route; the median run is asserted** |
| Themes | Run in light mode. An axe pass also runs in dark mode (Playwright, `colorScheme: 'dark'`). |

### 7.2 Budgets (CI fails if exceeded)

| Metric | Budget |
|---|---|
| Lighthouse Performance / Accessibility / Best Practices / SEO | ≥ 95 / 100 / ≥ 95 / 100 |
| LCP (median, conditions above) | ≤ 1.8 s |
| CLS | ≤ 0.02 |
| TBT | ≤ 50 ms |
| **Total JS per page, gzipped** | **≤ 5 KB**, including **every** script (theme, copy, reveal). There is no router. If `ClientRouter` is ever added, the budget becomes ≤ 15 KB *including the router*. |
| Total transfer for `/` (excluding images below the fold) | ≤ 250 KB |

### 7.3 Fonts

- Apple devices resolve `-apple-system` first, and **browsers only download a `@font-face` when it's actually used to render text**, so Inter is never fetched there.
- Inter is **not preloaded**. A `<link rel="preload">` would force the download on every device, Apple included. Instead it uses `font-display: swap` with a metric-matched fallback (`size-adjust` on a local Arial face) to keep layout shift near zero on non-Apple devices.
- Latin subset only.

### 7.4 SEO

- Per-page title, description and canonical URL (`https://arjun.buzz/...`), Open Graph and Twitter tags, `sitemap.xml`, `robots.txt`.
- JSON-LD `ProfilePage` with a `Person` main entity (name, jobTitle, worksFor, sameAs: GitHub, LinkedIn). This **helps search engines understand the profile**. It doesn't guarantee an enhanced search result.

---

## 8. Delivery and launch

### 8.1 Milestones

| Milestone | Scope | Output |
|---|---|---|
| **M1 Scaffold** | Astro, TS, Tailwind v4, lint, `astro check`, CI, Vercel preview | Empty themed shell deployed |
| **M2 Design system** | Tokens + contrast unit test, typography, Button/Tag/Card, header, footer, theme toggle | Component preview page |
| **M3 Home** | Hero, Featured work, Experience, About + skills, Contact, copy email, reveal; content contract and build rules | Full home page |
| **M4 Case studies** | Template + Pexit, PGSinKokrajhar, HorizonVision content | Case study pages |
| **M5 Evidence and assets** | Claims register resolved (§5.4), screenshots/diagrams, résumé decision | Content-complete site |
| **M6 Launch** | Acceptance checks (§8.3) green, OG images, `arjun.buzz` DNS on Vercel | Production |

Each milestone is a PR with a Vercel preview link.

### 8.2 Publication gates (launch is blocked until all are resolved)

| Gate | Requirement |
|---|---|
| **Public résumé** | Decide: publish the current PDF (includes phone number), or a web version without it. Until then, the Résumé link points to LinkedIn and `resume.published = false`. |
| **Employer case study (Pexit)** | Written OK from Updot to describe the architecture publicly, and for which screenshots/diagrams (`caseStudyApproved`). Until then the Pexit card shows only the scope already public on the résumé (`publicationApproved: true`) and no case study. |
| **Employer media (Pexit)** | Updot's OK for the architecture diagram (`diagramApproved`) and any product screenshot (`coverApproved: false` until then). Screenshots should show realistic demo data, not test fixtures. |
| **Client work naming** | Confirm each client in §5.4 may be named. Until then they are `publicationApproved: false`, so they appear only in draft builds. |
| **Claims** | Every row in §5.4 is either evidenced or switched to its fallback wording. |
| **Case study text** | Each case study's placeholder text is replaced with the real story and its `placeholderContent` flag removed. Production builds skip flagged pages automatically. |
| **Project evidence** | All 3 featured projects have a screenshot or diagram, a contribution line and an outcome line. **Required.** |
| Portrait | **Not required** for launch. |
| `arjun.buzz` | If it currently hosts something, confirm replacing it. DNS access confirmed. |

### 8.3 Acceptance checks (automated in Playwright unless marked manual)

**Navigation and anchors**
- [ ] Header links go to `#work`, `#experience` and `#about`, and the section heading is fully visible below the sticky header (heading top ≥ header bottom).
- [ ] Cross-page anchors work: from `/projects/pexit`, clicking `/#contact` and `/#work` lands on the correct section with the heading visible.
- [ ] Every internal link resolves (no 404s). Every external link has `rel="noopener noreferrer"`.
- [ ] Navigating home → case study → back → another case study shows correct content, theme, and working copy button on every page (between-page navigation, not only direct loads).

**Keyboard and assistive tech**
- [ ] Tab order: skip link → wordmark → header links → Résumé → theme toggle → main content (DOM order matches the desktop row). Every control has a visible focus ring.
- [ ] Skip link moves focus to `<main>`.
- [ ] The theme toggle works with Enter and Space and announces its state.
- [ ] axe reports zero violations on all routes in light **and** dark themes.

**Copy email**
- [ ] On success, "Email copied" is announced (`aria-live`).
- [ ] On failure (clipboard permission denied, mocked), the failure message with the visible address is announced.
- [ ] With the Clipboard API unavailable, the button is hidden and the `mailto:` link still works.

**Theme**
- [ ] With no stored choice, the theme follows the OS setting (emulated light and dark).
- [ ] The chosen theme persists across reloads and page navigations, with no flash of the wrong theme (screenshot at first paint).
- [ ] With `localStorage` throwing, the site still renders and follows the OS setting.

**Resilience**
- [ ] **JavaScript disabled:** all content on all routes is visible and readable, links work, the theme follows the OS, and the toggle and copy buttons are hidden (no dead controls).
- [ ] `prefers-reduced-motion: reduce`: no reveal transforms and no hover scaling.
- [ ] At 320px width: no horizontal scroll, and the header fits without overlap.

**Performance and content**
- [ ] Lighthouse CI budgets (§7.2) pass under the §7.1 conditions.
- [ ] Content build rules (§5.6) pass, and no unapproved project ships in production.
- [ ] Manual: review on a real iPhone (Safari) and a real Android phone (Chrome).

---

### 8.4 Launch runbook

1. Run `pnpm launch:check`. It reads the content files and the claims register, and exits non-zero while any §8.2 gate is open.
2. Confirm the latest `main` deployment on Vercel is green, and review it on a real iPhone (Safari) and Android phone (Chrome).
3. In Vercel → Project → Settings → Domains, add `arjun.buzz` (and `www.arjun.buzz` redirecting to it), then set the DNS records Vercel shows at the domain registrar.
4. After DNS resolves, check `https://arjun.buzz/` loads over HTTPS, the link preview renders (LinkedIn Post Inspector), and `https://arjun.buzz/sitemap-index.xml` is reachable. Submit the sitemap in Google Search Console.

Security headers (`vercel.json`): `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options: DENY`, `Permissions-Policy`, HSTS, and immutable caching for `/_astro/*`. The Content Security Policy is a per-page `<meta>` generated by Astro with SHA-256 hashes for every script and style, so no `'unsafe-inline'` is needed.

## 9. Open items

All open items now live in the **publication gates (§8.2)** and the **claims register (§5.4)**. None of them block M1–M4, which use placeholder or fallback wording until they're resolved.
