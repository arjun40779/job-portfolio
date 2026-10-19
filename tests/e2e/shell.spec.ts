import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const routes = ["/", "/404", "/styleguide"];

test.describe("site shell", () => {
  test("home page renders its heading and metadata", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Arjun Singh/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Arjun Singh",
    );
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      "content",
      /.+/,
    );
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      "https://arjun.buzz/",
    );
  });

  test("unknown routes serve the custom 404 page", async ({ page }) => {
    const response = await page.goto("/does-not-exist");
    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Page not found",
    );
  });

  test("styleguide is kept out of search results", async ({ page }) => {
    await page.goto("/styleguide");
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      "content",
      "noindex",
    );
  });

  test("skip link moves focus to main content", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("Tab");
    const skip = page.getByRole("link", { name: "Skip to content" });
    await expect(skip).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.locator("main#main")).toBeFocused();
  });

  test("external links use rel=noopener noreferrer", async ({ page }) => {
    await page.goto("/");
    const external = page.locator('a[href^="http"]');
    for (const link of await external.all()) {
      await expect(link).toHaveAttribute("rel", "noopener noreferrer");
    }
  });

  for (const route of routes) {
    test(`no axe violations on ${route}`, async ({ page }) => {
      await page.goto(route);
      const results = await new AxeBuilder({ page }).analyze();
      expect(results.violations).toEqual([]);
    });

    test(`no horizontal scroll at 320px on ${route}`, async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 640 });
      await page.goto(route);
      const overflow = await page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("content is visible and the theme toggle is hidden", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator("[data-theme-toggle]")).toBeHidden();
    await expect(page.getByRole("link", { name: "Email me" })).toHaveAttribute(
      "href",
      "mailto:arjun40779@gmail.com",
    );
  });
});
