import type { Page } from "@playwright/test";

/** Scrolls through the page so every reveal-on-scroll element is shown. */
export async function revealAll(page: Page): Promise<void> {
  await page.evaluate(async () => {
    for (
      let y = 0;
      y < document.body.scrollHeight;
      y += window.innerHeight / 2
    ) {
      window.scrollTo(0, y);
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForFunction(
    () =>
      document.querySelectorAll("[data-reveal]:not(.is-revealed)").length === 0,
  );
  // Let the 300ms reveal transition finish before measuring colours.
  await page.waitForTimeout(400);
}

/** Distance from the bottom of the sticky header to the top of an element. */
export async function gapBelowHeader(
  page: Page,
  selector: string,
): Promise<number> {
  return page.evaluate((sel) => {
    const header = document
      .querySelector("body > header")
      ?.getBoundingClientRect();
    const target = document.querySelector(sel)?.getBoundingClientRect();
    if (!header || !target) return Number.NaN;
    return target.top - header.bottom;
  }, selector);
}
