import { expect, test } from "@playwright/test";
import { draftCaseStudies, drafts } from "./env";

const routes = [
  "/",
  "/404",
  "/styleguide/",
  ...(drafts ? draftCaseStudies.map(({ slug }) => `/projects/${slug}/`) : []),
];

test.describe("link previews and structured data", () => {
  for (const route of routes) {
    test(`${route} has a working Open Graph image`, async ({
      page,
      request,
    }) => {
      await page.goto(route);
      const image = await page
        .locator('meta[property="og:image"]')
        .getAttribute("content");
      expect(image).toMatch(/^https:\/\/arjun\.buzz\/og\/.+\.png$/);
      await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
        "content",
        "summary_large_image",
      );
      // The image must exist in this build (served locally under the same path).
      const response = await request.get(new URL(image ?? "").pathname);
      expect(response.status()).toBe(200);
      expect(response.headers()["content-type"]).toContain("image/png");
    });
  }

  test("case studies get their own preview image", async ({ page }) => {
    test.skip(!drafts, "needs SHOW_DRAFTS=true build");
    await page.goto("/projects/pginkokrajhar/");
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
      "content",
      "https://arjun.buzz/og/projects-pginkokrajhar.png",
    );
  });

  test("the home page describes the person as a ProfilePage", async ({
    page,
  }) => {
    await page.goto("/");
    const raw = await page
      .locator('script[type="application/ld+json"]')
      .textContent();
    const data = JSON.parse(raw ?? "{}");
    expect(data["@type"]).toBe("ProfilePage");
    expect(data.mainEntity).toMatchObject({
      "@type": "Person",
      name: "Arjun Singh",
      jobTitle: "Full-Stack Software Engineer",
      sameAs: expect.arrayContaining(["https://github.com/arjun40779"]),
      worksFor: { name: "Updot" },
    });
  });

  test("the sitemap lists public pages only", async ({ request }) => {
    const sitemap = await (await request.get("/sitemap-0.xml")).text();
    expect(sitemap).toContain("<loc>https://arjun.buzz/</loc>");
    expect(sitemap).not.toMatch(/styleguide|404|\/og\//);
    const robots = await (await request.get("/robots.txt")).text();
    expect(robots).toContain("Sitemap: https://arjun.buzz/sitemap-index.xml");
  });
});

test.describe("content security policy", () => {
  for (const route of routes) {
    test(`${route} has a CSP and no violations`, async ({ page }) => {
      const violations: string[] = [];
      page.on("console", (message) => {
        if (/Content Security Policy/i.test(message.text()))
          violations.push(message.text());
      });
      await page.goto(route);
      await expect(
        page.locator('meta[http-equiv="content-security-policy"]'),
      ).toHaveAttribute("content", /script-src 'self' 'sha256-/);
      // Scripts still run under the policy: the head script and the toggle.
      await expect(page.locator("html")).toHaveClass(/\bjs\b/);
      await expect(page.locator("[data-theme-toggle]")).toBeVisible();
      expect(violations).toEqual([]);
    });
  }
});
