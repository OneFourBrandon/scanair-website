import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const compactLayout = window.matchMedia("(max-width: 860px)");
const hero = document.querySelector<HTMLElement>("[data-listing-hero]");
const shell = hero?.querySelector<HTMLElement>("[data-listing-hero-shell]");

const getCenteredOffset = () => {
  if (!hero || !shell) {
    return 0;
  }

  const currentTop = shell.offsetTop;
  const centeredTop = Math.max(0, (hero.offsetHeight - shell.offsetHeight) / 2);

  return Math.max(0, centeredTop - currentTop);
};

if (hero && shell && !reduceMotion.matches && !compactLayout.matches) {
  shell.classList.add("is-scroll-centering");

  gsap.to(shell, {
    y: getCenteredOffset,
    ease: "none",
    scrollTrigger: {
      trigger: hero,
      start: "top 68%",
      end: "top 48%",
      scrub: true,
      invalidateOnRefresh: true,
    },
  });

  window.addEventListener("load", () => ScrollTrigger.refresh(), { once: true });
}

export {};
