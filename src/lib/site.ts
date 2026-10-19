// Navigation and site-level settings. Profile data lives in src/content/profile.json.

export const navLinks = [
  { label: "Work", href: "/#work" },
  { label: "Experience", href: "/#experience" },
  { label: "About", href: "/#about" },
] as const;

/** Public source repository. The footer hides the link while this is unset. */
export const sourceUrl: string | undefined = undefined;

/**
 * Publication gate (docs/DESIGN.md §8.2): until the résumé is approved for the
 * web, Résumé links point to LinkedIn.
 */
export function resumeHref(profile: {
  resume: { path: string; published: boolean };
  socials: { linkedin: string };
}): string {
  return profile.resume.published
    ? profile.resume.path
    : profile.socials.linkedin;
}

export function isExternal(href: string): boolean {
  return /^https?:\/\//.test(href);
}
