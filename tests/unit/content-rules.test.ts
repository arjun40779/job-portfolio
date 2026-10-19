import { describe, expect, it } from "vitest";
import {
  contentErrors,
  hasCaseStudyPage,
  showsCover,
  showsDiagram,
  sortExperience,
  visibleProjects,
  type ExperienceLike,
  type ProjectLike,
} from "../../src/lib/content-rules";
import { formatRange, formatYearMonth } from "../../src/lib/format";

function project(
  overrides: Partial<ProjectLike> & { id: string },
): ProjectLike {
  return {
    publicationApproved: true,
    contribution: "Built it.",
    outcome: "It shipped.",
    evidence: [],
    ...overrides,
  };
}

function role(
  overrides: Partial<ExperienceLike> & { id: string },
): ExperienceLike {
  return {
    start: "2024-01",
    end: "2024-12",
    bullets: ["Did things."],
    evidence: [],
    ...overrides,
  };
}

function errorsFor(input: {
  projects?: ProjectLike[];
  experience?: ExperienceLike[];
  skills?: { id: string; items: { name: string; usedIn: string[] }[] }[];
}) {
  const projects = input.projects ?? [];
  return contentErrors({
    projects,
    visible: visibleProjects(projects, false),
    experience: input.experience ?? [],
    skills: input.skills ?? [],
  });
}

describe("visibleProjects", () => {
  const items = [
    project({ id: "a" }),
    project({ id: "b", publicationApproved: false }),
  ];

  it("drops unapproved projects from production builds", () => {
    expect(visibleProjects(items, false).map((p) => p.id)).toEqual(["a"]);
  });

  it("keeps them in drafts builds", () => {
    expect(visibleProjects(items, true).map((p) => p.id)).toEqual(["a", "b"]);
  });
});

describe("sortExperience", () => {
  it("puts the newest role first regardless of file order", () => {
    const sorted = sortExperience([
      role({ id: "old", start: "2022-01" }),
      role({ id: "new", start: "2026-07", end: null }),
      role({ id: "mid", start: "2024-03" }),
    ]);
    expect(sorted.map((r) => r.id)).toEqual(["new", "mid", "old"]);
  });
});

describe("contentErrors", () => {
  it("accepts valid content", () => {
    expect(
      errorsFor({
        projects: [
          project({ id: "a", featuredRank: 1 }),
          project({ id: "b", featuredRank: 2 }),
        ],
        experience: [role({ id: "job", end: null })],
        skills: [
          { id: "backend", items: [{ name: "Node", usedIn: ["a", "job"] }] },
        ],
      }),
    ).toEqual([]);
  });

  it("rejects duplicate or gapped featured ranks", () => {
    expect(
      errorsFor({
        projects: [
          project({ id: "a", featuredRank: 1 }),
          project({ id: "b", featuredRank: 1 }),
        ],
      }),
    ).toHaveLength(1);
    expect(
      errorsFor({
        projects: [
          project({ id: "a", featuredRank: 1 }),
          project({ id: "b", featuredRank: 3 }),
        ],
      }),
    ).toHaveLength(1);
  });

  it("checks ranks among the projects that actually ship", () => {
    // Hiding the rank-1 project leaves rank 2 first, which must fail the build.
    expect(
      errorsFor({
        projects: [
          project({ id: "a", featuredRank: 1, publicationApproved: false }),
          project({ id: "b", featuredRank: 2 }),
        ],
      }),
    ).toHaveLength(1);
  });

  it("allows at most one current role", () => {
    expect(
      errorsFor({
        experience: [
          role({ id: "a", end: null }),
          role({ id: "b", end: null }),
        ],
      }),
    ).toHaveLength(1);
  });

  it("rejects skill references to unknown ids", () => {
    expect(
      errorsFor({
        skills: [
          { id: "backend", items: [{ name: "Node", usedIn: ["typo"] }] },
        ],
      }),
    ).toEqual(['Skill "Node" references unknown id "typo"']);
  });

  it("rejects percentages without evidence", () => {
    expect(
      errorsFor({
        projects: [project({ id: "a", outcome: "Cut load time by 30%" })],
      }),
    ).toHaveLength(1);
    expect(
      errorsFor({
        experience: [
          role({ id: "a", bullets: ["Improved efficiency by 25 %"] }),
        ],
      }),
    ).toHaveLength(1);
    expect(
      errorsFor({
        projects: [
          project({
            id: "a",
            outcome: "Cut load time by 30%",
            evidence: [{ method: "Lighthouse" }],
          }),
        ],
      }),
    ).toEqual([]);
  });

  it("allows counts that aren't percentages", () => {
    expect(
      errorsFor({
        experience: [role({ id: "a", bullets: ["Redesigned 20+ screens"] })],
      }),
    ).toEqual([]);
  });
});

describe("format", () => {
  it("formats year-month values", () => {
    expect(formatYearMonth("2026-07")).toBe("Jul 2026");
    expect(formatRange("2024-03", "2025-08")).toBe("Mar 2024 – Aug 2025");
    expect(formatRange("2026-07", null)).toBe("Jul 2026 – Present");
  });
});

describe("hasCaseStudyPage", () => {
  const ready = {
    featuredRank: 1,
    caseStudyApproved: true,
    placeholderContent: false,
  };

  it("publishes approved, real case studies", () => {
    expect(hasCaseStudyPage(ready, false)).toBe(true);
  });

  it("keeps placeholder or unapproved case studies out of production", () => {
    expect(
      hasCaseStudyPage({ ...ready, placeholderContent: true }, false),
    ).toBe(false);
    expect(
      hasCaseStudyPage({ ...ready, caseStudyApproved: false }, false),
    ).toBe(false);
  });

  it("shows every featured case study in draft builds", () => {
    expect(
      hasCaseStudyPage(
        { ...ready, placeholderContent: true, caseStudyApproved: false },
        true,
      ),
    ).toBe(true);
  });

  it("never creates pages for projects that aren't featured", () => {
    expect(hasCaseStudyPage({ ...ready, featuredRank: undefined }, true)).toBe(
      false,
    );
  });
});

describe("showsDiagram", () => {
  it("hides unapproved diagrams from production", () => {
    expect(showsDiagram({ diagram: "x", diagramApproved: false }, false)).toBe(
      false,
    );
  });

  it("shows approved diagrams, and every diagram in draft builds", () => {
    expect(showsDiagram({ diagram: "x", diagramApproved: true }, false)).toBe(
      true,
    );
    expect(showsDiagram({ diagram: "x", diagramApproved: false }, true)).toBe(
      true,
    );
  });

  it("needs a diagram to show one", () => {
    expect(showsDiagram({ diagramApproved: true }, true)).toBe(false);
  });
});

describe("showsCover", () => {
  it("ships approved screenshots and holds back unapproved ones", () => {
    expect(showsCover({ cover: {}, coverApproved: true }, false)).toBe(true);
    expect(showsCover({ cover: {}, coverApproved: false }, false)).toBe(false);
  });

  it("shows every screenshot in draft builds", () => {
    expect(showsCover({ cover: {}, coverApproved: false }, true)).toBe(true);
  });

  it("needs a screenshot to show one", () => {
    expect(showsCover({ coverApproved: true }, true)).toBe(false);
  });
});
