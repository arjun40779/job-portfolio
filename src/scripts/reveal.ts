// Reveal on scroll (docs/DESIGN.md §2.1 #3, §4.7). Content is only ever
// hidden under html.js with motion allowed (see global.css), and three
// safety nets keep it from staying hidden:
// - a CSS animation reveals everything after 2s if this script never runs;
// - without IntersectionObserver everything is revealed at once;
// - if the observer hasn't reported within 1.5s, everything is revealed.

const OBSERVER_TIMEOUT_MS = 1500;

export function initReveal(): void {
  const root = document.documentElement;
  const items = [
    ...document.querySelectorAll<HTMLElement>(
      "[data-reveal]:not(.is-revealed)",
    ),
  ];
  const reveal = (el: Element) => el.classList.add("is-revealed");

  // This script is running, so the CSS-only fallback can stand down.
  root.classList.add("reveal-active");

  if (!("IntersectionObserver" in window)) {
    items.forEach(reveal);
    return;
  }

  let reported = false;
  const observer = new IntersectionObserver(
    (entries) => {
      reported = true;
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        reveal(entry.target);
        observer.unobserve(entry.target);
      }
    },
    { rootMargin: "0px 0px -8% 0px" },
  );

  items.forEach((el) => observer.observe(el));

  setTimeout(() => {
    if (reported) return;
    items.forEach(reveal);
    observer.disconnect();
  }, OBSERVER_TIMEOUT_MS);
}
