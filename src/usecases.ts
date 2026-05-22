import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const section = document.querySelector<HTMLElement>(".use-cases");

if (section) {
  const rows = gsap.utils.toArray<HTMLElement>(".usecase-index .index-row");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const shell = section.querySelector<HTMLElement>(".shell");
  const list = section.querySelector<HTMLElement>(".usecase-index");
  const route = document.getElementById("usecases-route") as SVGPathElement | null;
  const svg = document.querySelector<SVGSVGElement>(".usecases-route-svg");
  const waypoint = document.querySelector<HTMLElement>(".usecases-waypoint");
  const pulse = document.querySelector<HTMLElement>(".usecases-waypoint-pulse");

  let routeLen = 0;
  let routeDrawn = false;

  /* The flight track is a straight vertical rail pinned to the left
     edge of the use-case list — a plumb line the waypoint rides down.
     The SVG viewBox is 0–100 and stretches to the section, so the
     coordinates below are percentages of section width / height. */
  const buildRoute = () => {
    if (!shell || !list || !route) {
      return;
    }
    const sectionWidth = section.offsetWidth;
    const sectionHeight = section.offsetHeight;
    const railX = (shell.offsetLeft / sectionWidth) * 100;
    const listTop = shell.offsetTop + list.offsetTop;
    const listBottom = listTop + list.offsetHeight;
    const y1 = ((listTop - 18) / sectionHeight) * 100;
    const y2 = ((listBottom + 18) / sectionHeight) * 100;

    route.setAttribute(
      "d",
      `M ${railX.toFixed(2)} ${y1.toFixed(2)} L ${railX.toFixed(2)} ${y2.toFixed(2)}`,
    );
    routeLen = route.getTotalLength();
  };

  buildRoute();

  if (reduceMotion || rows.length === 0) {
    /* No motion — show everything, leave the rail statically drawn. */
    gsap.set(rows, { opacity: 1, y: 0 });
    if (route) {
      gsap.set(route, { strokeDasharray: "1.6 2.4", strokeDashoffset: 0 });
    }
    ScrollTrigger.addEventListener("refresh", buildRoute);
  } else {
    /* --- background: flight path draw-on + waypoint travel --- */
    if (route && svg && waypoint) {
      gsap.set(route, { strokeDasharray: `${routeLen} ${routeLen}`, strokeDashoffset: routeLen });
      gsap.set(waypoint, { xPercent: -50, yPercent: -50, opacity: 0 });

      let ctm = route.getScreenCTM();
      let box = svg.getBoundingClientRect();
      const refreshGeom = () => {
        ctm = route.getScreenCTM();
        box = svg.getBoundingClientRect();
      };
      window.addEventListener("resize", refreshGeom, { passive: true });

      const travel = { p: 0 };
      const moveWaypoint = () => {
        if (!ctm) {
          return;
        }
        const point = route.getPointAtLength(travel.p * routeLen).matrixTransform(ctm);
        gsap.set(waypoint, { x: point.x - box.left, y: point.y - box.top });
      };
      moveWaypoint();

      ScrollTrigger.create({
        trigger: section,
        start: "top 78%",
        once: true,
        onEnter: () => {
          refreshGeom();
          /* Stage 1: the rail draws itself on, top to bottom. */
          gsap.to(route, {
            strokeDashoffset: 0,
            duration: 1.8,
            ease: "power2.inOut",
            onComplete: () => {
              /* Stage 2: settle into a slowly marching dashed rail. */
              routeDrawn = true;
              gsap.set(route, { strokeDasharray: "1.6 2.4" });
              gsap.to(route, {
                strokeDashoffset: -8,
                duration: 2.6,
                ease: "none",
                repeat: -1,
              });
            },
          });
          /* The waypoint marker rides the rail on a loop. */
          gsap.to(waypoint, { opacity: 1, duration: 0.7, delay: 0.5 });
          gsap.to(travel, {
            p: 1,
            duration: 11,
            ease: "none",
            repeat: -1,
            onUpdate: moveWaypoint,
          });
          if (pulse) {
            gsap.fromTo(
              pulse,
              { scale: 1, opacity: 0.5 },
              { scale: 2.8, opacity: 0, duration: 1.7, ease: "power1.out", repeat: -1 },
            );
          }
        },
      });
    }

    /* --- effects: staggered reveal, counting numbers, drawing icons --- */
    gsap.set(rows, { y: 32 });

    const countNumber = (row: HTMLElement) => {
      const numEl = row.querySelector<HTMLElement>(".index-num");
      if (!numEl) {
        return;
      }
      const target = parseInt(numEl.textContent ?? "0", 10);
      const counter = { value: 0 };
      gsap.to(counter, {
        value: target,
        duration: 0.85,
        ease: "power1.out",
        onUpdate: () => {
          numEl.textContent = String(Math.round(counter.value)).padStart(2, "0");
        },
      });
    };

    const drawIcon = (row: HTMLElement) => {
      const shapes = gsap.utils.toArray<SVGGeometryElement>(
        row.querySelectorAll(".index-icon svg > *"),
      );
      shapes.forEach((shape) => {
        const shapeLen = shape.getTotalLength();
        gsap.set(shape, { strokeDasharray: shapeLen, strokeDashoffset: shapeLen });
      });
      gsap.to(shapes, {
        strokeDashoffset: 0,
        duration: 0.7,
        ease: "power2.out",
        stagger: 0.08,
      });
    };

    ScrollTrigger.batch(rows, {
      start: "top 88%",
      onEnter: (batch) => {
        const fresh = (batch as HTMLElement[]).filter((row) => !row.dataset.revealed);
        if (fresh.length === 0) {
          return;
        }
        fresh.forEach((row) => {
          row.dataset.revealed = "true";
        });
        /* Rows rise and fade in beside the rail. */
        gsap.to(fresh, {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "power3.out",
          stagger: 0.1,
        });
        fresh.forEach((row) => {
          countNumber(row);
          drawIcon(row);
        });
      },
    });

    /* Keep the rail aligned to the list when the layout changes. */
    ScrollTrigger.addEventListener("refresh", () => {
      buildRoute();
      if (route && !routeDrawn) {
        gsap.set(route, {
          strokeDasharray: `${routeLen} ${routeLen}`,
          strokeDashoffset: routeLen,
        });
      }
    });

    /* --- effect: a scan line sweeps the list once on entry --- */
    const scan = document.querySelector<HTMLElement>(".usecases-scan");

    if (scan && list) {
      ScrollTrigger.create({
        trigger: list,
        start: "top 82%",
        once: true,
        onEnter: () => {
          const top = list.offsetTop;
          const height = list.offsetHeight;
          gsap.set(scan, { y: top, opacity: 0 });
          gsap
            .timeline()
            .to(scan, { opacity: 0.95, duration: 0.18 }, 0)
            .to(scan, { y: top + height, duration: 1.05, ease: "power1.inOut" }, 0)
            .to(scan, { opacity: 0, duration: 0.32 }, 0.72);
        },
      });
    }
  }
}

export {};
