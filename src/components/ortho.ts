import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const comparisons = document.querySelectorAll<HTMLElement>("[data-ortho-compare]");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const compactLayout = window.matchMedia("(max-width: 680px)").matches;

comparisons.forEach((comparison) => {
  const label = comparison.querySelector<HTMLElement>("[data-ortho-label]");
  const setLabel = (isAfter: boolean) => {
    if (label) {
      label.textContent = isAfter ? "After" : "Before";
    }
  };

  if (reduceMotion || compactLayout) {
    comparison.style.setProperty("--wipe", compactLayout ? "125%" : "200%");
    setLabel(compactLayout || reduceMotion);
    return;
  }

  gsap.fromTo(
    comparison,
    { "--wipe": "0%" },
    {
      "--wipe": "200%",
      ease: "none",
      onUpdate() {
        setLabel(this.progress() >= 0.5);
      },
      scrollTrigger: {
        trigger: comparison,
        start: "bottom bottom",
        end: "+=160%",
        pin: true,
        scrub: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
      },
    },
  );
});

export {};
