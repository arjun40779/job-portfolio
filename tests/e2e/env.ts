/** True when the suite runs against a draft build (SHOW_DRAFTS=true pnpm build). */
export const drafts = process.env.SHOW_DRAFTS === "true";

/** Case study routes present in draft builds; production has none until approved. */
export const draftCaseStudies = [
  { slug: "pexit", title: "Pexit" },
  { slug: "pginkokrajhar", title: "PGSinKokrajhar" },
  { slug: "horizonvision-group", title: "HorizonVision Group" },
] as const;
