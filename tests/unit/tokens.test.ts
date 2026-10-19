import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { contrastRatio } from "../../src/lib/contrast";
import { contrastPairs, parseThemeTokens } from "../../src/lib/tokens";

const css = readFileSync(
  new URL("../../src/styles/global.css", import.meta.url),
  "utf8",
);
const tokens = parseThemeTokens(css);

describe("contrastRatio", () => {
  it("matches known WCAG values", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 5);
    expect(contrastRatio("#ffffff", "#ffffff")).toBeCloseTo(1, 5);
    expect(contrastRatio("#ffffff", "#0071e3")).toBeCloseTo(4.7, 2);
  });

  it("rejects malformed colours", () => {
    expect(() => contrastRatio("red", "#ffffff")).toThrow();
  });
});

describe("theme tokens", () => {
  it("defines the same dark values for the OS preference and the explicit toggle", () => {
    expect(tokens.darkExplicit).toEqual(tokens.darkSystem);
  });

  it("defines every token used by a contrast pair", () => {
    for (const { fg, bg } of contrastPairs) {
      expect(tokens.light, `--${fg}`).toHaveProperty(fg);
      expect(tokens.light, `--${bg}`).toHaveProperty(bg);
    }
  });

  for (const [theme, values] of [
    ["light", tokens.light],
    ["dark", tokens.darkExplicit],
  ] as const) {
    describe(`${theme} theme meets WCAG AA`, () => {
      for (const pair of contrastPairs) {
        it(`--${pair.fg} on --${pair.bg} ≥ ${pair.min} (${pair.use})`, () => {
          const fg = values[pair.fg];
          const bg = values[pair.bg];
          if (!fg || !bg)
            throw new Error(`missing --${pair.fg} or --${pair.bg}`);
          expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(pair.min);
        });
      }
    });
  }
});
