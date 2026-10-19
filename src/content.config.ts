// Content collections (docs/DESIGN.md §5.6). Cross-entry rules (unique
// featured ranks, valid references, evidence for numbers) live in
// src/lib/content-rules.ts and run when the pages load the content.
import { defineCollection } from "astro:content";
import { file, glob } from "astro/loaders";
import { z } from "astro/zod";

const id = z
  .string()
  .regex(/^[a-z0-9-]+$/, "Use lowercase letters, digits and dashes");
const yearMonth = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Use YYYY-MM");

const evidence = z.object({
  label: z.string(), // "LCP on product pages"
  value: z.string(), // "−30%"
  baseline: z.string(), // "3.1s → 2.2s"
  method: z.string(), // "Lighthouse mobile, median of 5 runs"
  myRole: z.string(), // "Implemented ISR and the bundle split"
});

// profile.json is a single object keyed by id: { "main": { ... } }
const profile = defineCollection({
  loader: file("src/content/profile.json"),
  schema: z.object({
    name: z.string(),
    title: z.string(),
    statement: z.string(),
    subline: z.string(),
    description: z.string(), // default meta description
    location: z.string(),
    experienceSummary: z.string(),
    email: z.email(),
    openToWork: z.boolean(),
    socials: z.object({ github: z.url(), linkedin: z.url() }),
    resume: z.object({ path: z.string(), published: z.boolean() }),
    about: z.string(),
    education: z.array(
      z.object({
        id,
        title: z.string(),
        institution: z.string(),
        dates: z.string(),
        detail: z.string().optional(),
      }),
    ),
  }),
});

// experience.json is an array; every entry has a stable, unique id.
const experience = defineCollection({
  loader: file("src/content/experience.json"),
  schema: z
    .object({
      id,
      company: z.string(),
      product: z.string().optional(),
      role: z.string(),
      start: yearMonth,
      end: yearMonth.nullable(), // null = present
      location: z.string().optional(),
      bullets: z.array(z.string()).min(1).max(3),
      tech: z.array(z.string()),
      evidence: z.array(evidence).default([]),
    })
    .refine(
      (e) => e.end === null || e.end >= e.start,
      "end must be on or after start",
    ),
});

const skills = defineCollection({
  loader: file("src/content/skills.json"),
  schema: z.object({
    id: z.enum(["backend", "frontend", "delivery"]),
    title: z.string(),
    items: z.array(
      z.object({ name: z.string(), usedIn: z.array(id).default([]) }),
    ),
  }),
});

// projects/<slug>.mdx: the id is the file name. Prominence (featuredRank)
// and ownership are independent properties.
const projects = defineCollection({
  loader: glob({ pattern: "**/*.mdx", base: "src/content/projects" }),
  schema: ({ image }) =>
    z
      .object({
        title: z.string(),
        summary: z.string(),
        ownership: z.enum([
          "personal",
          "freelance-client",
          "employer",
          "agency-client",
        ]),
        featuredRank: z.number().int().min(1).optional(), // present = featured; 1 = large card
        clientOrder: z.number().int().min(1).optional(), // order in the client work list
        facts: z
          .object({
            role: z.string(),
            team: z.string(),
            timeline: z.string(),
            scope: z.string(),
          })
          .optional(),
        contribution: z.string(), // "I built …", shown on the card
        outcome: z.string(), // concrete; numbers need evidence (§5.4)
        evidence: z.array(evidence).default([]),
        cover: image().optional(),
        coverAlt: z.string().optional(),
        publicationApproved: z.boolean(), // gate for the card itself
        caseStudyApproved: z.boolean(), // separate gate for the case study page
        // True while the case study body is placeholder text. Such pages only
        // ship in draft builds, so invented content never reaches production.
        placeholderContent: z.boolean().default(false),
        live: z.url().optional(),
        code: z.url().optional(),
        tags: z.array(z.string()),
      })
      .refine((p) => !p.cover || !!p.coverAlt, "cover requires coverAlt")
      .refine(
        (p) => p.featuredRank === undefined || !!p.facts,
        "featured projects need facts",
      ),
});

export const collections = { profile, experience, skills, projects };
