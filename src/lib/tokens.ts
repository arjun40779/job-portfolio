// Reads the colour tokens out of src/styles/global.css so the contrast test
// and the styleguide check the values that actually ship.

export type TokenMap = Record<string, string>;

export interface ThemeTokens {
  light: TokenMap;
  /** Dark values applied by `prefers-color-scheme: dark`. */
  darkSystem: TokenMap;
  /** Dark values applied by `data-theme="dark"`. Must match `darkSystem`. */
  darkExplicit: TokenMap;
}

function block(css: string, selector: string): string {
  const start = css.indexOf(`${selector} {`);
  if (start === -1) throw new Error(`Token block "${selector}" not found`);
  const end = css.indexOf("}", start);
  return css.slice(start, end);
}

function hexTokens(body: string): TokenMap {
  const tokens: TokenMap = {};
  for (const [, name, value] of body.matchAll(
    /--([a-z0-9-]+):\s*(#[0-9a-f]{6})\s*;/gi,
  )) {
    if (name && value) tokens[name] = value.toLowerCase();
  }
  return tokens;
}

export function parseThemeTokens(css: string): ThemeTokens {
  const light = hexTokens(block(css, ":root"));
  return {
    light,
    // Dark blocks only override what changes, so fill the rest from light.
    darkSystem: {
      ...light,
      ...hexTokens(block(css, ':root:not([data-theme="light"])')),
    },
    darkExplicit: {
      ...light,
      ...hexTokens(block(css, ':root[data-theme="dark"]')),
    },
  };
}

export interface ContrastPair {
  fg: string;
  bg: string;
  min: number;
  use: string;
}

/** Every pair from docs/DESIGN.md §4.3 that must meet WCAG AA. */
export const contrastPairs: ContrastPair[] = [
  ...(["bg", "surface"] as const).flatMap((bg) => [
    { fg: "text", bg, min: 4.5, use: "Body text" },
    { fg: "text-muted", bg, min: 4.5, use: "Secondary text" },
    { fg: "link", bg, min: 4.5, use: "Text links" },
    { fg: "link-hover", bg, min: 4.5, use: "Text links (hover)" },
    { fg: "control-border", bg, min: 3, use: "Outlined control boundary" },
    { fg: "focus-ring", bg, min: 3, use: "Focus indicator" },
    { fg: "btn-primary-bg", bg, min: 3, use: "Filled button boundary" },
    { fg: "success", bg, min: 3, use: "Status dot" },
  ]),
  {
    fg: "btn-primary-fg",
    bg: "btn-primary-bg",
    min: 4.5,
    use: "Filled button label",
  },
  {
    fg: "btn-primary-fg",
    bg: "btn-primary-bg-hover",
    min: 4.5,
    use: "Filled button label (hover)",
  },
  {
    fg: "btn-primary-fg",
    bg: "btn-primary-bg-active",
    min: 4.5,
    use: "Filled button label (pressed)",
  },
];
