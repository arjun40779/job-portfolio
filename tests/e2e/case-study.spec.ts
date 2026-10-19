import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { draftCaseStudies, drafts } from "./env";

test.describe("case studies in production builds", () => {
  test.skip(drafts, "production-only behaviour");

  test("placeholder case studies are not published", async ({
    page,
    request,
  }) => {
    await page.goto("/");
    await expect(
      page.getByRole("link", { name: /Read case study/ }),
    ).toHaveCount(0);
    for (const { slug } of draftCaseStudies) {
      expect((await request.get(`/projects/${slug}/`)).status()).toBe(404);
    }
  });
});

test.describe("case studies in draft builds", () => {
  test.skip(!drafts, "needs SHOW_DRAFTS=true build");

  test("cards link to their case study", async ({ page }) => {
    await page.goto("/");
    for (const { slug, title } of draftCaseStudies) {
      await expect(
        page
          .locator(`#project-${slug}`)
          .getByRole("link", { name: `Read case study (${title})` }),
      ).toHaveAttribute("href", `/projects/${slug}/`);
    }
  });

  for (const [i, { slug, title }] of draftCaseStudies.entries()) {
    test(`${slug} has the case study structure`, async ({ page }) => {
      await page.goto(`/projects/${slug}/`);
      await expect(page).toHaveTitle(`${title} · Arjun Singh`);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(title);
      await expect(page.getByText("Draft", { exact: true })).toBeVisible();

      const facts = page.locator("article dl dt");
      await expect(facts).toHaveText(["Role", "Team", "Timeline", "Scope"]);

      const body = page.locator(".case-study h2");
      await expect(body).toHaveText([
        "Problem",
        "What I built",
        "Key decisions",
        "Results",
      ]);
      await expect(
        page.getByRole("heading", { level: 2, name: "Stack" }),
      ).toBeVisible();

      const nav = page.getByRole("navigation", { name: "Case studies" });
      const next = draftCaseStudies[(i + 1) % draftCaseStudies.length];
      await expect(
        nav.getByRole("link", { name: `Next project: ${next?.title}` }),
      ).toHaveAttribute("href", `/projects/${next?.slug}/`);
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
    await page.goto("/projects/pexit/");
    await page
      .locator("[data-theme-toggle] label", { hasText: "Dark" })
      .click();
    await page.getByRole("link", { name: /Next project/ }).click();
    await expect(page).toHaveURL(/\/projects\/pginkokrajhar\/$/);
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await expect(page.getByRole("radio", { name: "Dark" })).toBeChecked();
  });
});
