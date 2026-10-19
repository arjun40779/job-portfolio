// Loads and validates all site content once per build.
import { getCollection, getEntry, type CollectionEntry } from "astro:content";
import {
  contentErrors,
  hasCaseStudyPage,
  showsCover,
  showsDiagram,
  sortExperience,
  visibleProjects,
} from "./content-rules";

/** Drafts (unapproved projects) show in dev, Vercel previews, or with SHOW_DRAFTS=true. */
export const showDrafts =
  import.meta.env.DEV ||
  process.env.VERCEL_ENV === "preview" ||
  process.env.SHOW_DRAFTS === "true";

export type Project = CollectionEntry<"projects">["data"] & {
  id: string;
  /** The project itself isn't approved; it only appears in draft builds. */
  draft: boolean;
  /** This build includes a case study page for the project. */
  caseStudy: boolean;
  /** The case study is unapproved or still placeholder text. */
  caseStudyDraft: boolean;
  /** This build shows the project's screenshot (approved, or a draft build). */
  showCover: boolean;
  /** This build shows the project's diagram (approved, or a draft build). */
  showDiagram: boolean;
};
export type Role = CollectionEntry<"experience">["data"];
export type SkillGroup = CollectionEntry<"skills">["data"];
export type Profile = CollectionEntry<"profile">["data"];

export interface Reference {
  label: string;
  href: string;
}

export function caseStudyHref(project: Pick<Project, "id">): string {
  return `/projects/${project.id}/`;
}

export interface SiteContent {
  profile: Profile;
  experience: Role[];
  skills: SkillGroup[];
  featured: Project[];
  clientWork: Project[];
  /** Featured projects with a case study page in this build, in rank order. */
  caseStudies: Project[];
  /** Anchor targets on the home page for skill "used in" links. */
  references: Map<string, Reference>;
}

let cached: Promise<SiteContent> | undefined;

async function load(): Promise<SiteContent> {
  const profileEntry = await getEntry("profile", "main");
  if (!profileEntry)
    throw new Error('src/content/profile.json needs a "main" entry');

  const projects: Project[] = (await getCollection("projects")).map(
    (entry) => ({
      ...entry.data,
      id: entry.id,
      draft: !entry.data.publicationApproved,
      caseStudy: hasCaseStudyPage(entry.data, showDrafts),
      caseStudyDraft:
        !entry.data.caseStudyApproved || entry.data.placeholderContent,
      showCover: showsCover(entry.data, showDrafts),
      showDiagram: showsDiagram(entry.data, showDrafts),
    }),
  );
  const experience = sortExperience(
    (await getCollection("experience")).map((e) => e.data),
  );
  const skillOrder = ["backend", "frontend", "delivery"];
  const skills = (await getCollection("skills"))
    .map((e) => e.data)
    .sort((a, b) => skillOrder.indexOf(a.id) - skillOrder.indexOf(b.id));
  const visible = visibleProjects(projects, showDrafts);

  const errors = contentErrors({ projects, visible, experience, skills });
  if (errors.length > 0)
    throw new Error(`Content rules failed:\n- ${errors.join("\n- ")}`);

  const featured = visible
    .filter((p) => p.featuredRank !== undefined)
    .sort((a, b) => (a.featuredRank ?? 0) - (b.featuredRank ?? 0));
  const clientWork = visible
    .filter((p) => p.ownership === "agency-client")
    .sort((a, b) => (a.clientOrder ?? 0) - (b.clientOrder ?? 0));
  const caseStudies = featured.filter((p) => p.caseStudy);

  const references = new Map<string, Reference>();
  for (const p of featured)
    references.set(p.id, { label: p.title, href: `#project-${p.id}` });
  for (const r of experience) {
    references.set(r.id, { label: r.company, href: `#experience-${r.id}` });
  }

  return {
    profile: profileEntry.data,
    experience,
    skills,
    featured,
    clientWork,
    caseStudies,
    references,
  };
}

export function getSiteContent(): Promise<SiteContent> {
  cached ??= load();
  return cached;
}
