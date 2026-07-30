/* Mobile navigation, header scroll state, and scroll reveal. */

const header = document.querySelector<HTMLElement>(".site-header");
const toggle = document.querySelector<HTMLButtonElement>("[data-nav-toggle]");
const menu = document.getElementById("mobile-menu");

if (header && toggle && menu) {
  const setOpen = (open: boolean) => {
    header.classList.toggle("is-menu-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  };

  toggle.addEventListener("click", (event) => {
    event.stopPropagation();
    setOpen(!header.classList.contains("is-menu-open"));
  });

  menu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => setOpen(false));
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      setOpen(false);
    }
  });

  document.addEventListener("click", (event) => {
    if (!header.classList.contains("is-menu-open")) {
      return;
    }

    if (event.target instanceof Node && header.contains(event.target)) {
      return;
    }

    setOpen(false);
  });

  const desktopQuery = window.matchMedia("(min-width: 981px)");
  desktopQuery.addEventListener("change", (event) => {
    if (event.matches) {
      setOpen(false);
    }
  });
}

/* Solid header once the page is scrolled. */
if (header) {
  const syncScrollState = () => {
    header.classList.toggle("is-scrolled", window.scrollY > 12);
  };

  syncScrollState();
  window.addEventListener("scroll", syncScrollState, { passive: true });
}

/* Scroll reveal — gated behind a JS class so content stays visible without JS. */
const revealSelector = [
  ".section-rule",
  ".section-head",
  ".timeline-step",
  ".samples-carousel",
  ".ortho-layout",
  ".cta-strip",
  ".usecases-aside",
  ".tools-content",
  ".contact-aside-inner",
  ".contact-form",
  ".roof-hero-copy",
  ".roof-hero-visual",
  ".roof-note",
  ".roof-index li",
  ".roof-steps",
  ".roof-deliverables-grid",
].join(",");

const revealTargets = Array.from(
  document.querySelectorAll<HTMLElement>(revealSelector),
);

if (revealTargets.length && "IntersectionObserver" in window) {
  document.documentElement.classList.add("js-reveal");
  revealTargets.forEach((element) => element.classList.add("reveal"));

  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { rootMargin: "0px 0px -12% 0px", threshold: 0.12 },
  );

  revealTargets.forEach((element) => revealObserver.observe(element));
}

export {};
