// Lists the publication gates from docs/DESIGN.md §8.2 that still block
// launch, by reading the content files. Exits 1 while any gate is open.
// Usage: pnpm launch:check
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { parse } from "yaml";

const root = new URL("..", import.meta.url).pathname;
const content = join(root, "src/content");

function frontmatter(source) {
  const match = /^---\n([\s\S]*?)\n---/.exec(source);
  return match ? parse(match[1]) : {};
}

const blockers = [];
const block = (gate, detail) => blockers.push({ gate, detail });

const profile = JSON.parse(
  await readFile(join(content, "profile.json"), "utf8"),
).main;
if (!profile.resume?.published) {
  block(
    "Public résumé",
    "resume.published is false, so Résumé links point to LinkedIn",
  );
}

const files = (await readdir(join(content, "projects"))).filter((f) =>
  f.endsWith(".mdx"),
);
for (const file of files) {
  const id = file.replace(/\.mdx$/, "");
  const p = frontmatter(
    await readFile(join(content, "projects", file), "utf8"),
  );
  const featured = p.featuredRank !== undefined;

  if (!p.publicationApproved)
    block("Client work naming", `${id}: publicationApproved is false`);
  if (featured && p.placeholderContent)
    block("Case study text", `${id}: placeholderContent is true`);
  if (featured && !p.caseStudyApproved)
    block("Employer case study", `${id}: caseStudyApproved is false`);
  if (p.diagram && !p.diagramApproved)
    block("Employer media", `${id}: diagramApproved is false`);
  if (p.cover && p.coverApproved === false)
    block("Employer media", `${id}: coverApproved is false`);
  if (featured && !p.cover && !(p.diagram && p.diagramApproved)) {
    block("Project evidence", `${id}: no approved screenshot or diagram`);
  }
}

// Claims (§5.4) can't be detected from content alone; they stay listed until
// the register in the design doc is marked resolved.
const design = await readFile(join(root, "docs/DESIGN.md"), "utf8");
const openClaims = (design.match(/⏳/g) ?? []).length;
if (openClaims > 0)
  block("Claims", `${openClaims} row(s) in §5.4 still marked ⏳`);

if (blockers.length === 0) {
  console.log("All publication gates are resolved. Ready to launch.");
  process.exit(0);
}

console.log(`${blockers.length} launch blocker(s):\n`);
const width = Math.max(...blockers.map((b) => b.gate.length));
for (const { gate, detail } of blockers)
  console.log(`  ${gate.padEnd(width)}  ${detail}`);
process.exit(1);
