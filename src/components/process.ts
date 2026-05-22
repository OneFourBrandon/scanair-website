import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const processSection = document.querySelector<HTMLElement>(".process");

if (processSection) {
  const arrows = gsap.utils.toArray<SVGElement>(".timeline-flow-arrow");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  arrows.forEach((arrow) => {
    const line = arrow.querySelector<SVGGeometryElement>(".flow-arrow-line");
    const head = arrow.querySelector<SVGGeometryElement>(".flow-arrow-head");
    const paths = [line, head].filter((p): p is SVGGeometryElement => p !== null);

    if (paths.length === 0) {
      return;
    }

    if (reduceMotion) {
      paths.forEach((path) => gsap.set(path, { strokeDasharray: "none", strokeDashoffset: 0 }));
      return;
    }

    /* Hide each path with a full-length dash offset. */
    paths.forEach((path) => {
      const length = path.getTotalLength();
      gsap.set(path, { strokeDasharray: length, strokeDashoffset: length });
    });

    /* Draw the squiggle on, then the arrowhead, when it scrolls into view. */
    ScrollTrigger.create({
      trigger: arrow,
      start: "top 85%",
      once: true,
      onEnter: () => {
        const timeline = gsap.timeline();
        if (line) {
          timeline.to(line, {
            strokeDashoffset: 0,
            duration: 1.3,
            ease: "power2.inOut",
          });
        }
        if (head) {
          timeline.to(
            head,
            {
              strokeDashoffset: 0,
              duration: 0.4,
              ease: "power2.out",
            },
            ">-0.12",
          );
        }
      },
    });
  });
}

export {};
