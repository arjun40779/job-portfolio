import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { allCaseStudies, caseStudies, drafts } from "./env";

test.describe("case study publishing", () => {
  test("only approved case studies exist in production", async ({
    request,
  }) => {
    test.skip(drafts, "production-only behaviour");
    for (const { slug, live } of allCaseStudies) {
      expect((await request.get(`/projects/${slug}/`)).status(), slug).toBe(
        live ? 200 : 404,
      );
    }
  });

  test("cards link to a case study only when the build has one", async ({
    page,
  }) => {
    await page.goto("/");
    for (const { slug, title } of allCaseStudies) {
      const link = page
        .locator(`#project-${slug}`)
        .getByRole("link", { name: `Read case study (${title})` });
      if (caseStudies.some((c) => c.slug === slug)) {
        await expect(link).toHaveAttribute("href", `/projects/${slug}/`);
      } else {
        await expect(link).toHaveCount(0);
      }
    }
  });
});

test.describe("case study pages", () => {
  for (const [i, { slug, title, live }] of caseStudies.entries()) {
    test(`${slug} has the case study structure`, async ({ page }) => {
      await page.goto(`/projects/${slug}/`);
      await expect(page).toHaveTitle(`${title} · Arjun Singh`);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(title);
      // Only unapproved case studies (draft builds) carry the Draft tag.
      await expect(page.getByText("Draft", { exact: true })).toHaveCount(
        live ? 0 : 1,
      );

      await expect(page.locator("article dl dt")).toHaveText([
        "Role",
        "Team",
        "Timeline",
        "Scope",
      ]);
      await expect(page.locator(".case-study h2")).toHaveText([
        "Problem",
        "What I built",
        "Key decisions",
        "Results",
      ]);
      await expect(
        page.getByRole("heading", { level: 2, name: "Stack" }),
      ).toBeVisible();

      const nav = page.getByRole("navigation", { name: "Case studies" });
      const next = caseStudies[(i + 1) % caseStudies.length];
      if (next && next.slug !== slug) {
        await expect(
          nav.getByRole("link", { name: `Next project: ${next.title}` }),
        ).toHaveAttribute("href", `/projects/${next.slug}/`);
      }
      await nav.getByRole("link", { name: "Back to work" }).click();
      await expect(page).toHaveURL(/\/#work$/);
    });

    test(`${slug} has no axe violations and no horizontal scroll at 320px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: 320, height: 640 });
      await page.goto(`/projects/${slug}/`);
      const results = await new AxeBuilder({ page }).analyze();
      expect(results.violations).toEqual([]);
      const overflow = await page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }

  test("the theme persists when moving between case studies", async ({
    page,
  }) => {
    const [first, second] = caseStudies;
    await page.goto(`/projects/${first?.slug}/`);
    await page
      .locator("[data-theme-toggle] label", { hasText: "Dark" })
      .click();
    await page.getByRole("link", { name: /Next project/ }).click();
    await expect(page).toHaveURL(new RegExp(`/projects/${second?.slug}/$`));
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await expect(page.getByRole("radio", { name: "Dark" })).toBeChecked();
  });
});
