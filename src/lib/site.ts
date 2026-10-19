// Site-wide profile and navigation. Moves to the profile content collection in M3.

export interface SiteConfig {
  name: string;
  title: string;
  description: string;
  email: string;
  socials: { github: string; linkedin: string };
  resume: { path: string; published: boolean };
  /** Public source repository. The footer hides the link while this is unset. */
  sourceUrl?: string;
}

export const site: SiteConfig = {
  name: "Arjun Singh",
  title: "Full-Stack Software Engineer",
  description:
    "Arjun Singh, full-stack engineer building production web applications, from Fastify APIs and PostgreSQL to React interfaces.",
  email: "arjun40779@gmail.com",
  socials: {
    github: "https://github.com/arjun40779",
    linkedin: "https://www.linkedin.com/in/arjun-singh-541554117",
  },
  // Publication gate (docs/DESIGN.md §8.2): until the résumé is approved for
  // the web, the Résumé link points to LinkedIn.
  resume: { path: "/resume.pdf", published: false },
};

export const resumeHref = site.resume.published
  ? site.resume.path
  : site.socials.linkedin;

export const navLinks = [
  { label: "Work", href: "/#work" },
  { label: "Experience", href: "/#experience" },
  { label: "About", href: "/#about" },
] as const;

export function isExternal(href: string): boolean {
  return /^https?:\/\//.test(href);
}
