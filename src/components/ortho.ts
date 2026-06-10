import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const comparisons = document.querySelectorAll<HTMLElement>("[data-ortho-compare]");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

comparisons.forEach((comparison) => {
  const section = comparison.closest<HTMLElement>(".ortho-mapping") || comparison;

  if (reduceMotion) {
    comparison.style.setProperty("--wipe", "200%");
    return;
  }

  gsap.fromTo(
    comparison,
    { "--wipe": "0%" },
    {
      "--wipe": "200%",
      ease: "none",
      scrollTrigger: {
        trigger: section,
        start: "top top",
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
