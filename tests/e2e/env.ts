/** True when the suite runs against a draft build (SHOW_DRAFTS=true pnpm build). */
export const drafts = process.env.SHOW_DRAFTS === "true";

/** Featured case studies in rank order; `live` ones are published in production. */
export const allCaseStudies = [
  { slug: "pexit", title: "Pexit", live: false },
  { slug: "pginkokrajhar", title: "PGSinKokrajhar", live: true },
  { slug: "horizonvision-group", title: "HorizonVision Group", live: true },
] as const;

/** Case studies in the build under test, in rank order. */
export const caseStudies = allCaseStudies.filter((c) => drafts || c.live);
