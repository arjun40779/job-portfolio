// Copy-email button (docs/DESIGN.md §2.1 #2). Without the Clipboard API (or
// without JS) the button stays hidden; the mailto link always works.

const RESET_AFTER_MS = 5000;

export function initCopyEmail(): void {
  if (typeof navigator.clipboard?.writeText !== "function") return;

  for (const root of document.querySelectorAll<HTMLElement>(
    "[data-copy-email]",
  )) {
    if (root.dataset.bound) continue;
    root.dataset.bound = "true";

    const button = root.querySelector<HTMLButtonElement>("[data-copy-button]");
    const status = root.querySelector<HTMLElement>("[data-copy-status]");
    const email = root.dataset.copyEmail ?? "";
    if (!button || !status) continue;

    let timer: ReturnType<typeof setTimeout> | undefined;

    button.addEventListener("click", async () => {
      let message: string;
      try {
        await navigator.clipboard.writeText(email);
        message = "Email copied";
      } catch {
        message = `Couldn't copy. Email: ${email}`;
      }
      // Clear first so a repeated message is announced again.
      status.textContent = "";
      requestAnimationFrame(() => {
        status.textContent = message;
      });
      clearTimeout(timer);
      timer = setTimeout(() => {
        status.textContent = "";
      }, RESET_AFTER_MS);
    });

    button.hidden = false;
  }
}
