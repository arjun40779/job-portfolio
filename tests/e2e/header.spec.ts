import { expect, test } from "@playwright/test";

const LINKEDIN = "https://www.linkedin.com/in/arjun-singh-541554117";

test.describe("header", () => {
  test("has the primary links and a Résumé link", async ({ page }) => {
    await page.goto("/");
    const nav = page.getByRole("navigation", { name: "Primary" });
    for (const [label, href] of [
      ["Work", "/#work"],
      ["Experience", "/#experience"],
      ["About", "/#about"],
    ]) {
      await expect(
        nav.getByRole("link", { name: label, exact: true }),
      ).toHaveAttribute("href", href);
    }
    // Résumé is gated (DESIGN.md §8.2): it points to LinkedIn until approved.
    const resume = nav.getByRole("link", { name: "Résumé" });
    await expect(resume).toHaveAttribute("href", LINKEDIN);
    await expect(resume).toHaveAttribute("rel", "noopener noreferrer");
  });

  test("tab order runs skip link, wordmark, links, Résumé, theme", async ({
    page,
  }) => {
    await page.goto("/");
    const expected = [
      "Skip to content",
      "Arjun Singh",
      "Work",
      "Experience",
      "About",
      "Résumé",
    ];
    for (const name of expected) {
      await page.keyboard.press("Tab");
      await expect(page.locator(":focus")).toHaveAccessibleName(name);
    }
    await page.keyboard.press("Tab");
    await expect(page.getByRole("radio", { name: "System" })).toBeFocused();
  });

  test("stays at the top of the viewport when scrolling", async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 400 });
    await page.goto("/styleguide");
    await page.mouse.wheel(0, 1500);
    await expect
      .poll(async () => (await page.locator("body > header").boundingBox())?.y)
      .toBe(0);
  });

  for (const width of [320, 768, 1280]) {
    test(`fits within the reserved header height at ${width}px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.goto("/");
      const header = await page.locator("body > header").boundingBox();
      const reserved = await page.evaluate(() => {
        const probe = document.createElement("div");
        probe.style.height = "var(--header-h)";
        document.body.append(probe);
        const height = probe.getBoundingClientRect().height;
        probe.remove();
        return height;
      });
      expect(header?.height).toBeLessThanOrEqual(reserved);

      // Header items must not overlap each other.
      const boxes = await page
        .locator("body > header a, body > header fieldset")
        .evaluateAll((els) =>
          els.map((el) => el.getBoundingClientRect().toJSON()),
        );
      for (let i = 0; i < boxes.length; i++) {
        for (let j = i + 1; j < boxes.length; j++) {
          const a = boxes[i];
          const b = boxes[j];
          const overlap =
            a.left < b.right &&
            b.left < a.right &&
            a.top < b.bottom &&
            b.top < a.bottom;
          expect(overlap, `header items ${i} and ${j} overlap`).toBe(false);
        }
        expect(boxes[i].right).toBeLessThanOrEqual(width);
      }
    });
  }
});

test.describe("footer", () => {
  for (const route of ["/", "/404", "/styleguide"]) {
    test(`has the email link on ${route}`, async ({ page }) => {
      await page.goto(route);
      const footer = page.locator("body > footer");
      await expect(
        footer.getByRole("link", { name: "arjun40779@gmail.com" }),
      ).toHaveAttribute("href", "mailto:arjun40779@gmail.com");
      await expect(footer.getByRole("link", { name: /GitHub/ })).toBeVisible();
      await expect(
        footer.getByRole("link", { name: /LinkedIn/ }),
      ).toBeVisible();
    });
  }
});
