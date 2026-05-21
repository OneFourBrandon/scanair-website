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

export {};
