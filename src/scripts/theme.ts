// Theme toggle (docs/DESIGN.md §2.1 #1). The inline head script in
// BaseLayout applies the stored choice before first paint; this wires up the
// toggle. Without JS the toggle stays hidden and the OS setting applies.

type Choice = "system" | "light" | "dark";

const STORAGE_KEY = "theme";

function isChoice(value: unknown): value is Choice {
  return value === "system" || value === "light" || value === "dark";
}

function applyChoice(choice: Choice): void {
  const root = document.documentElement;
  if (choice === "system") delete root.dataset.theme;
  else root.dataset.theme = choice;

  try {
    if (choice === "system") localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, choice);
  } catch {
    // Storage blocked: the choice still applies to this page.
  }
}

export function initThemeToggle(): void {
  const current = document.documentElement.dataset.theme;
  const active: Choice =
    current === "light" || current === "dark" ? current : "system";

  for (const group of document.querySelectorAll<HTMLFieldSetElement>(
    "[data-theme-toggle]",
  )) {
    if (group.dataset.bound) continue;
    group.dataset.bound = "true";

    for (const input of group.querySelectorAll<HTMLInputElement>(
      'input[name="theme"]',
    )) {
      input.checked = input.value === active;
    }

    group.addEventListener("change", (event) => {
      const target = event.target;
      if (target instanceof HTMLInputElement && isChoice(target.value))
        applyChoice(target.value);
    });

    group.hidden = false;
  }
}
