import { expect, test, type Page } from "@playwright/test";

const BG = { light: "rgb(255, 255, 255)", dark: "rgb(0, 0, 0)" } as const;

function htmlBackground(page: Page) {
  return page.evaluate(
    () => getComputedStyle(document.documentElement).backgroundColor,
  );
}

function option(page: Page, label: "System" | "Light" | "Dark") {
  return page.locator("[data-theme-toggle] label", { hasText: label });
}

test.describe("theme", () => {
  test("follows the OS setting when no choice is stored", async ({
    page,
  }, testInfo) => {
    const scheme =
      testInfo.project.use.colorScheme === "dark" ? "dark" : "light";
    await page.goto("/");
    await expect(page.locator("html")).not.toHaveAttribute("data-theme");
    expect(await htmlBackground(page)).toBe(BG[scheme]);
    await expect(page.getByRole("radio", { name: "System" })).toBeChecked();
  });

  test("a chosen theme applies and persists across reloads and pages", async ({
    page,
  }) => {
    await page.goto("/");
    await option(page, "Dark").click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    expect(await htmlBackground(page)).toBe(BG.dark);

    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await expect(page.getByRole("radio", { name: "Dark" })).toBeChecked();

    await page.goto("/styleguide");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

    await option(page, "Light").click();
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    expect(await htmlBackground(page)).toBe(BG.light);
  });

  test("choosing System clears the stored choice", async ({ page }) => {
    await page.goto("/");
    await option(page, "Dark").click();
    await option(page, "System").click();
    await expect(page.locator("html")).not.toHaveAttribute("data-theme");
    expect(await page.evaluate(() => localStorage.getItem("theme"))).toBeNull();
  });

  test("the stored theme is applied before the body is parsed (no flash)", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      localStorage.setItem("theme", "dark");
      const observer = new MutationObserver(() => {
        if (!document.body) return;
        (window as unknown as { themeAtBody: string | null }).themeAtBody =
          document.documentElement.dataset.theme ?? null;
        observer.disconnect();
      });
      // The init script runs before <html> exists, so watch the whole document.
      observer.observe(document, { childList: true, subtree: true });
    });
    await page.goto("/");
    const themeAtBody = await page.evaluate(
      () => (window as unknown as { themeAtBody: string | null }).themeAtBody,
    );
    expect(themeAtBody).toBe("dark");
  });

  test("works with the keyboard and exposes its state", async ({ page }) => {
    await page.goto("/");
    const system = page.getByRole("radio", { name: "System" });
    await system.focus();
    await page.keyboard.press("ArrowRight");
    await expect(page.getByRole("radio", { name: "Light" })).toBeChecked();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    await page.keyboard.press("ArrowRight");
    await expect(page.getByRole("radio", { name: "Dark" })).toBeChecked();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await expect(page.getByRole("group", { name: "Theme" })).toBeVisible();
  });

  test("still works when storage is blocked", async ({ page }, testInfo) => {
    const errors: Error[] = [];
    page.on("pageerror", (error) => errors.push(error));
    await page.addInitScript(() => {
      Object.defineProperty(window, "localStorage", {
        get() {
          throw new DOMException("Storage blocked", "SecurityError");
        },
      });
    });
    const scheme =
      testInfo.project.use.colorScheme === "dark" ? "dark" : "light";

    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    expect(await htmlBackground(page)).toBe(BG[scheme]);

    await option(page, "Dark").click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    expect(errors).toEqual([]);
  });
});
