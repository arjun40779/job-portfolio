import { expect, test } from "@playwright/test";
import { drafts } from "./env";
import { revealAll } from "./helpers";

const routes = [
  "/",
  "/projects/pginkokrajhar/",
  "/projects/horizonvision-group/",
];

test.describe("project media", () => {
  for (const route of routes) {
    test(`every image on ${route} has alt text and loads`, async ({ page }) => {
      await page.goto(route);
      await revealAll(page);
      const images = page.locator("main img");
      expect(await images.count()).toBeGreaterThan(0);
      for (const img of await images.all()) {
        await img.scrollIntoViewIfNeeded();
        await expect(img).toHaveAttribute("alt", /\S/);
        await expect
          .poll(() =>
            img.evaluate(
              (el: HTMLImageElement) => el.complete && el.naturalWidth > 0,
            ),
          )
          .toBe(true);
      }
    });
  }

  test("the hero image loads first, as modern formats", async ({ page }) => {
    await page.goto("/");
    const hero = page.locator(
      "section[aria-labelledby='hero-heading'] picture",
    );
    await expect(hero.locator("source[type='image/avif']")).toHaveCount(1);
    await expect(hero.locator("source[type='image/webp']")).toHaveCount(1);
    const img = hero.locator("img");
    await expect(img).toHaveAttribute("loading", "eager");
    await expect(img).toHaveAttribute("fetchpriority", "high");
  });

  test("the PGSinKokrajhar card shows its screenshot", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#project-pginkokrajhar img")).toHaveAttribute(
      "alt",
      /PG in Kokrajhar home page/,
    );
  });

  test("the Pexit diagram ships only once approved", async ({ page }) => {
    await page.goto("/");
    const diagram = page
      .locator("#project-pexit")
      .getByRole("img", { name: /Pexit architecture/ });
    if (drafts) {
      await expect(diagram).toBeVisible();
    } else {
      // Production shows no diagram and no placeholder: the card is text-only.
      await expect(diagram).toHaveCount(0);
      await expect(page.locator("#project-pexit")).not.toContainText(
        "Image coming soon",
      );
      await expect(
        page.locator("#project-pexit img, #project-pexit svg[role='img']"),
      ).toHaveCount(0);
    }
  });

  test("the HorizonVision Group card shows its screenshot", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(
      page.locator("#project-horizonvision-group img"),
    ).toHaveAttribute("alt", /Horizon Vision Group home page/);
  });
});
