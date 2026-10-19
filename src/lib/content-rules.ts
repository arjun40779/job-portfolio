// Cross-entry content rules (docs/DESIGN.md §5.6). Pure functions so they can
// be unit tested without Astro; src/lib/content.ts applies them at build time.

export interface ProjectLike {
  id: string;
  featuredRank?: number | undefined;
  publicationApproved: boolean;
  contribution: string;
  outcome: string;
  evidence: unknown[];
}

export interface ExperienceLike {
  id: string;
  start: string;
  end: string | null;
  bullets: string[];
  evidence: unknown[];
}

export interface SkillGroupLike {
  id: string;
  items: { name: string; usedIn: string[] }[];
}

const PERCENT = /\d\s*%/;

/** Unapproved projects ship only in drafts (dev and preview) builds. */
export function visibleProjects<T extends ProjectLike>(
  projects: T[],
  showDrafts: boolean,
): T[] {
  return showDrafts ? projects : projects.filter((p) => p.publicationApproved);
}

export interface CaseStudyLike {
  featuredRank?: number | undefined;
  caseStudyApproved: boolean;
  placeholderContent: boolean;
}

/**
 * A featured project gets a case study page in production only when the page
 * is approved and its text is real. Draft builds show every featured one.
 */
export function hasCaseStudyPage(
  project: CaseStudyLike,
  showDrafts: boolean,
): boolean {
  if (project.featuredRank === undefined) return false;
  return (
    showDrafts || (project.caseStudyApproved && !project.placeholderContent)
  );
}

/** Newest role first, regardless of order in the JSON file. */
export function sortExperience<T extends ExperienceLike>(items: T[]): T[] {
  return [...items].sort((a, b) => b.start.localeCompare(a.start));
}

export function contentErrors(input: {
  projects: ProjectLike[];
  visible: ProjectLike[];
  experience: ExperienceLike[];
  skills: SkillGroupLike[];
}): string[] {
  const errors: string[] = [];

  const ranks = input.visible
    .map((p) => p.featuredRank)
    .filter((r): r is number => r !== undefined)
    .sort((a, b) => a - b);
  ranks.forEach((rank, i) => {
    if (rank !== i + 1) {
      errors.push(
        `featuredRank values must be unique and contiguous from 1; got ${ranks.join(", ")}`,
      );
    }
  });

  const current = input.experience.filter((e) => e.end === null);
  if (current.length > 1) {
    errors.push(
      `Only one role can be current (end: null); found ${current.map((e) => e.id).join(", ")}`,
    );
  }

  const known = new Set([
    ...input.projects.map((p) => p.id),
    ...input.experience.map((e) => e.id),
  ]);
  for (const group of input.skills) {
    for (const item of group.items) {
      for (const ref of item.usedIn) {
        if (!known.has(ref))
          errors.push(`Skill "${item.name}" references unknown id "${ref}"`);
      }
    }
  }

  for (const p of input.projects) {
    if (
      p.evidence.length === 0 &&
      (PERCENT.test(p.outcome) || PERCENT.test(p.contribution))
    ) {
      errors.push(
        `Project "${p.id}" states a percentage without evidence (§5.4)`,
      );
    }
  }
  for (const e of input.experience) {
    if (e.evidence.length === 0 && e.bullets.some((b) => PERCENT.test(b))) {
      errors.push(
        `Experience "${e.id}" states a percentage without evidence (§5.4)`,
      );
    }
  }

  return [...new Set(errors)];
}
