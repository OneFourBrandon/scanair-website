import { gsap } from "gsap";

const comparisons = document.querySelectorAll<HTMLElement>("[data-ortho-compare]");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

comparisons.forEach((comparison) => {
  const range = comparison.querySelector<HTMLInputElement>("[data-ortho-range]");

  if (!range) return;

  const setSplit = (value: string) => {
    comparison.style.setProperty("--split", `${value}%`);
  };

  range.addEventListener("input", () => {
    gsap.killTweensOf(comparison);
    setSplit(range.value);
  });

  if (reduceMotion) {
    setSplit(range.value);
    return;
  }

  setSplit("34");

  const observer = new IntersectionObserver(
    ([entry]) => {
      if (!entry?.isIntersecting) return;

      gsap.to(comparison, {
        "--split": `${range.value}%`,
        duration: 1.25,
        ease: "power3.out",
      });
      observer.disconnect();
    },
    { threshold: 0.38 },
  );

  observer.observe(comparison);
});

export {};
