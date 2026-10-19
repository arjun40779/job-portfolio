import { expect, test } from "@playwright/test";
import { gapBelowHeader, revealAll } from "./helpers";

test.describe("home page", () => {
  test("puts the evidence first: hero, work, experience, about, contact", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Arjun Singh",
    );
    await expect(page.getByRole("heading", { level: 2 })).toHaveText([
      "Things I've built",
      "Where I've worked",
      "A bit about me",
      "Let's work together.",
    ]);
    await expect(
      page.getByRole("link", { name: "View my work" }),
    ).toHaveAttribute("href", "#work");
  });

  test("shows featured projects in rank order with contribution and outcome", async ({
    page,
  }) => {
    await page.goto("/");
    const cards = page.locator("#work article");
    await expect(cards.getByRole("heading", { level: 3 })).toHaveText([
      "Pexit",
      "PG in Kokrajhar",
      "HorizonVision Group",
    ]);
    for (const card of await cards.all()) {
      await expect(card.getByText("What I built")).toBeVisible();
      await expect(card.getByText("Outcome")).toBeVisible();
    }
  });

  test("shows the client work list with direct links and no Draft badges", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(
      page.locator("#work").getByRole("heading", { name: "Client work" }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Visit site (Altudo)" }),
    ).toHaveAttribute("href", "https://www.altudo.co/");
    await expect(page.getByText("Draft", { exact: true })).toHaveCount(0);
  });

  test("lists experience newest first", async ({ page }) => {
    await page.goto("/");
    const roles = page.locator("#experience ol > li");
    await expect(roles).toHaveCount(4);
    await expect(roles.first()).toContainText("Updot");
    await expect(roles.first()).toContainText("Present");
    await expect(roles.last()).toContainText("Incero.ai");
  });

  test("states no unevidenced percentages", async ({ page }) => {
    await page.goto("/");
    const text = await page.locator("main").innerText();
    expect(text).not.toMatch(/\d\s*%/);
  });
});

test.describe("anchors", () => {
  for (const id of ["work", "experience", "about"]) {
    const label = id[0]?.toUpperCase() + id.slice(1);

    test(`header link to #${id} lands below the sticky header`, async ({
      page,
    }) => {
      await page.goto("/");
      await page
        .getByRole("navigation", { name: "Primary" })
        .getByRole("link", { name: label })
        .click();
      await expect(page).toHaveURL(new RegExp(`/#${id}$`));
      await expect
        .poll(() => gapBelowHeader(page, `#${id}-heading`))
        .toBeGreaterThanOrEqual(0);
      await expect(page.locator(`#${id}-heading`)).toBeInViewport();
    });

    test(`cross-page link to /#${id} works from another page`, async ({
      page,
    }) => {
      await page.goto("/404");
      await page
        .getByRole("navigation", { name: "Primary" })
        .getByRole("link", { name: label })
        .click();
      await expect(page).toHaveURL(new RegExp(`/#${id}$`));
      await expect
        .poll(() => gapBelowHeader(page, `#${id}-heading`))
        .toBeGreaterThanOrEqual(0);
      await expect(page.locator(`#${id}-heading`)).toBeInViewport();
    });
  }

  test("direct load of /#contact shows the contact heading", async ({
    page,
  }) => {
    await page.goto("/#contact");
    await expect
      .poll(() => gapBelowHeader(page, "#contact-heading"))
      .toBeGreaterThanOrEqual(0);
    await expect(page.locator("#contact-heading")).toBeInViewport();
  });

  const linkRoutes = ["/", "/404", "/styleguide", "/projects/pginkokrajhar/"];

  for (const route of linkRoutes) {
    test(`every internal link on ${route} resolves`, async ({
      page,
      request,
    }) => {
      await page.goto(route);
      const hrefs = await page
        .locator("a[href]")
        .evaluateAll((links) => links.map((a) => a.getAttribute("href") ?? ""));
      const internal = [
        ...new Set(hrefs.filter((h) => h.startsWith("/") || h.startsWith("#"))),
      ];
      expect(internal.length).toBeGreaterThan(0);

      for (const href of internal) {
        const url = new URL(href, page.url());
        const response = await request.get(url.pathname);
        expect(response.status(), href).toBe(200);
        if (url.hash) {
          const html = await response.text();
          expect(html, `${href} has no matching id`).toContain(
            `id="${url.hash.slice(1)}"`,
          );
        }
      }
    });
  }
});

test.describe("copy email", () => {
  test("announces success and copies the address", async ({
    page,
    context,
  }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/#contact");
    await page.getByRole("button", { name: "Copy email" }).click();
    await expect(page.getByRole("status")).toHaveText("Email copied");
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
      "arjun40779@gmail.com",
    );
  });

  test("announces failure with the visible address", async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "clipboard", {
        value: { writeText: () => Promise.reject(new Error("denied")) },
      });
    });
    await page.goto("/#contact");
    await page.getByRole("button", { name: "Copy email" }).click();
    await expect(page.getByRole("status")).toHaveText(
      "Couldn't copy. Email: arjun40779@gmail.com",
    );
  });

  test("hides the button without the Clipboard API; mailto still works", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "clipboard", { value: undefined });
    });
    await page.goto("/#contact");
    await expect(page.getByRole("button", { name: "Copy email" })).toBeHidden();
    await expect(
      page
        .locator("#contact")
        .getByRole("link", { name: "arjun40779@gmail.com" }),
    ).toHaveAttribute("href", "mailto:arjun40779@gmail.com");
  });
});

test.describe("reveal on scroll", () => {
  const hiddenCount = () =>
    [...document.querySelectorAll("[data-reveal]")].filter(
      (el) => getComputedStyle(el).opacity !== "1",
    ).length;

  test("reveals every element as it scrolls into view", async ({ page }) => {
    await page.goto("/");
    // Below-the-fold content starts hidden, so the effect is really in play.
    expect(await page.evaluate(hiddenCount)).toBeGreaterThan(0);
    await revealAll(page);
    expect(await page.evaluate(hiddenCount)).toBe(0);
  });

  test("never hides content with reduced motion", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    expect(await page.evaluate(hiddenCount)).toBe(0);
  });

  test("reveals everything if the observer never reports", async ({ page }) => {
    await page.addInitScript(() => {
      window.IntersectionObserver = class {
        observe() {}
        unobserve() {}
        disconnect() {}
        takeRecords() {
          return [];
        }
      } as unknown as typeof IntersectionObserver;
    });
    await page.goto("/");
    await expect
      .poll(() => page.evaluate(hiddenCount), { timeout: 4000 })
      .toBe(0);
  });

  test("reveals everything if the reveal script never runs", async ({
    page,
  }) => {
    // Strip the page's module scripts; the inline head script still adds html.js.
    await page.route("**/", async (route) => {
      const response = await route.fetch();
      const body = (await response.text()).replace(
        /<script type="module"[\s\S]*?<\/script>/g,
        "",
      );
      await route.fulfill({ response, body });
    });
    await page.goto("/");
    await expect(page.locator("html")).toHaveClass(/\bjs\b/);
    await expect
      .poll(() => page.evaluate(hiddenCount), { timeout: 5000 })
      .toBe(0);
  });

  test.describe("without JavaScript", () => {
    test.use({ javaScriptEnabled: false });

    test("shows all content", async ({ page }) => {
      await page.goto("/");
      expect(await page.evaluate(hiddenCount)).toBe(0);
      await expect(
        page.getByRole("button", { name: "Copy email" }),
      ).toBeHidden();
    });
  });
});
