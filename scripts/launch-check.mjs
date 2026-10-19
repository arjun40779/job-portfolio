// Checks the publication gates from docs/DESIGN.md §8.2 by reading the
// content files. Blockers would ship wrong or unfinished content and exit 1.
// Items held back until approved are listed but don't block: production
// builds leave them out automatically. Usage: pnpm launch:check
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
const pending = [];

const profile = JSON.parse(
  await readFile(join(content, "profile.json"), "utf8"),
).main;
if (!profile.resume?.published) {
  pending.push([
    "Public résumé",
    "resume.published is false, so Résumé links point to LinkedIn",
  ]);
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
  const ships = p.publicationApproved === true;

  if (!ships)
    pending.push(["Project", `${id}: publicationApproved is false (hidden)`]);
  if (ships && featured && p.caseStudyApproved && p.placeholderContent) {
    blockers.push([
      "Case study text",
      `${id}: approved case study still has placeholder text`,
    ]);
  }
  if (featured && !p.caseStudyApproved) {
    pending.push([
      "Case study",
      `${id}: caseStudyApproved is false (page hidden)`,
    ]);
  }
  if (p.diagram && !p.diagramApproved) {
    pending.push(["Media", `${id}: diagramApproved is false (diagram hidden)`]);
  }
  if (p.cover && p.coverApproved === false) {
    pending.push([
      "Media",
      `${id}: coverApproved is false (screenshot hidden)`,
    ]);
  }
}

// Claims (§5.4): any row still marked ⏳ in the register blocks launch.
const design = await readFile(join(root, "docs/DESIGN.md"), "utf8");
const openClaims = (design.match(/⏳/g) ?? []).length;
if (openClaims > 0)
  blockers.push(["Claims", `${openClaims} row(s) in §5.4 still marked ⏳`]);

function print(title, rows) {
  if (rows.length === 0) return;
  const width = Math.max(...rows.map(([gate]) => gate.length));
  console.log(`${title}:`);
  for (const [gate, detail] of rows)
    console.log(`  ${gate.padEnd(width)}  ${detail}`);
  console.log();
}

print("Blocking launch", blockers);
print(
  "Held back until approved (not blocking; production leaves these out)",
  pending,
);
console.log(
  blockers.length === 0 ? "Ready to launch." : `${blockers.length} blocker(s).`,
);
process.exit(blockers.length === 0 ? 0 : 1);
