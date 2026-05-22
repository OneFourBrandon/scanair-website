import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const section = document.querySelector<HTMLElement>(".use-cases");

if (section) {
  const rows = gsap.utils.toArray<HTMLElement>(".usecase-index .index-row");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (reduceMotion || rows.length === 0) {
    /* No motion — just make sure everything is visible. */
    gsap.set(rows, { opacity: 1, y: 0 });
  } else {
    const shell = section.querySelector<HTMLElement>(".shell");
    const route = document.getElementById("usecases-route") as SVGPathElement | null;
    const svg = document.querySelector<SVGSVGElement>(".usecases-route-svg");
    const waypoint = document.querySelector<HTMLElement>(".usecases-waypoint");
    const pulse = document.querySelector<HTMLElement>(".usecases-waypoint-pulse");

    /* --- background: drifting survey grid --- */
    gsap.to(".usecases-grid-lines", {
      x: -48,
      y: -48,
      duration: 7,
      ease: "none",
      repeat: -1,
    });

    const rowCount = rows.length;
    const weave = new Map<HTMLElement, number>();
    let routeLen = 0;
    let routeDrawn = false;

    /* Smooth S-curve horizontal offset for row i. */
    const weaveShift = (i: number, amplitude: number) =>
      amplitude * Math.sin(((i / Math.max(1, rowCount - 1)) * 1.5 + 0.25) * Math.PI);

    /* Catmull-Rom spline through the points, as an SVG path string. */
    const splinePath = (pts: { x: number; y: number }[]) => {
      if (pts.length < 2) {
        return "";
      }
      const f = (v: number) => v.toFixed(2);
      let d = `M ${f(pts[0].x)} ${f(pts[0].y)}`;
      for (let i = 0; i < pts.length - 1; i += 1) {
        const p0 = pts[i - 1] ?? pts[i];
        const p1 = pts[i];
        const p2 = pts[i + 1];
        const p3 = pts[i + 2] ?? pts[i + 1];
        const c1x = p1.x + (p2.x - p0.x) / 6;
        const c1y = p1.y + (p2.y - p0.y) / 6;
        const c2x = p2.x - (p3.x - p1.x) / 6;
        const c2y = p2.y - (p3.y - p1.y) / 6;
        d += ` C ${f(c1x)} ${f(c1y)} ${f(c2x)} ${f(c2y)} ${f(p2.x)} ${f(p2.y)}`;
      }
      return d;
    };

    /* Re-derives the row weave and routes the flight path through the
       clear gap beside the body text, so it never crosses the copy. */
    const buildRoute = () => {
      if (!shell || !route) {
        return;
      }
      const sectionWidth = section.offsetWidth;
      const sectionHeight = section.offsetHeight;
      const shellLeft = shell.offsetLeft;
      const shellTop = shell.offsetTop;
      const isMobile = window.innerWidth < 860;
      const amplitude = isMobile ? 0 : Math.min(54, window.innerWidth * 0.05);

      const points: { x: number; y: number }[] = [];
      rows.forEach((row, i) => {
        const shift = weaveShift(i, amplitude);
        weave.set(row, isMobile ? 0 : shift);

        const midY = shellTop + row.offsetTop + row.offsetHeight / 2;
        let xPx: number;
        if (isMobile) {
          /* No room to thread a gap — run down the left margin instead. */
          xPx =
            sectionWidth * 0.045 +
            Math.sin((i / Math.max(1, rowCount - 1)) * Math.PI * 2) * 7;
        } else {
          /* Sit in the gap just left of the body-text column. */
          const textEl = row.querySelector<HTMLElement>(".index-row-text");
          const textLeft = shellLeft + row.offsetLeft + (textEl ? textEl.offsetLeft : 0);
          xPx = textLeft + shift - 24;
        }
        points.push({
          x: (xPx / sectionWidth) * 100,
          y: (midY / sectionHeight) * 100,
        });
      });

      if (points.length === 0) {
        return;
      }
      /* Extend above the first row and below the last so it bleeds off. */
      const full = [
        { x: points[0].x, y: -8 },
        ...points,
        { x: points[points.length - 1].x, y: 108 },
      ];
      route.setAttribute("d", splinePath(full));
      routeLen = route.getTotalLength();
    };

    buildRoute();

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
          /* Stage 1: the route draws itself on. */
          gsap.to(route, {
            strokeDashoffset: 0,
            duration: 1.8,
            ease: "power2.inOut",
            onComplete: () => {
              /* Stage 2: settle into a slowly marching dashed path. */
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
          /* The waypoint marker travels the path on a loop. */
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

    /* --- effects: staggered reveal, weave-in, counting numbers, drawing icons --- */
    gsap.set(rows, { y: 32, x: 0 });

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
        /* Rows rise, fade in, and slide into their woven offset. */
        gsap.to(fresh, {
          opacity: 1,
          y: 0,
          x: (_index, target) => weave.get(target as HTMLElement) ?? 0,
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

    /* Keep the path and weave in sync when the layout changes. */
    ScrollTrigger.addEventListener("refresh", () => {
      buildRoute();
      if (route && !routeDrawn) {
        gsap.set(route, {
          strokeDasharray: `${routeLen} ${routeLen}`,
          strokeDashoffset: routeLen,
        });
      }
      rows.forEach((row) => {
        if (row.dataset.revealed) {
          gsap.set(row, { x: weave.get(row) ?? 0 });
        }
      });
    });

    /* --- effect: a scan line sweeps the list once on entry --- */
    const scan = document.querySelector<HTMLElement>(".usecases-scan");
    const list = document.querySelector<HTMLElement>(".usecase-index");

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
