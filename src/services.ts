import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const flow = document.querySelector<HTMLElement>(".services .services-flow");
const flightline = flow?.querySelector<HTMLElement>(".services-flightline") ?? null;
const svg = flightline?.querySelector<SVGSVGElement>(".services-flightline-svg") ?? null;
const path = flightline?.querySelector<SVGPathElement>(".services-flightline-path") ?? null;
const drone = flightline?.querySelector<HTMLElement>(".services-drone") ?? null;
const droneInner = drone?.querySelector<HTMLElement>(".services-drone-inner") ?? null;
const glow = drone?.querySelector<HTMLElement>(".services-drone-glow") ?? null;

if (flow && flightline && svg && path && drone && droneInner) {
  const rows = gsap.utils.toArray<HTMLElement>(flow.querySelectorAll(".flow-row"));
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (rows.length > 0) {
    type Waypoint = {
      row: HTMLElement;
      el: HTMLElement;
      ring: HTMLElement;
      arc: number;
      dropped: boolean;
    };

    /* One waypoint pin per row, parked in the right-hand gutter. */
    const waypoints: Waypoint[] = rows.map((row) => {
      const el = document.createElement("span");
      el.className = "services-waypoint";
      const ring = document.createElement("span");
      ring.className = "services-waypoint-ring";
      el.appendChild(ring);
      flightline.appendChild(el);
      return { row, el, ring, arc: 0, dropped: false };
    });

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

    let pathLen = 0;
    let lastArc = 0;

    /* Arc-length of the path point closest to a target coordinate. */
    const arcAtPoint = (target: { x: number; y: number }) => {
      let bestArc = 0;
      let bestDist = Infinity;
      const steps = 200;
      for (let i = 0; i <= steps; i += 1) {
        const arc = (i / steps) * pathLen;
        const pt = path.getPointAtLength(arc);
        const dist = (pt.x - target.x) ** 2 + (pt.y - target.y) ** 2;
        if (dist < bestDist) {
          bestDist = dist;
          bestArc = arc;
        }
      }
      return bestArc;
    };

    /* Re-derives the vertical flight path down the gutter and re-pins
       each waypoint at its row's centre. */
    const buildRoute = () => {
      const w = flow.offsetWidth;
      const h = flow.offsetHeight;
      svg.setAttribute("viewBox", `0 0 ${w} ${h}`);

      const bodyEl = flow.querySelector<HTMLElement>(".flow-body");
      const gutter = bodyEl ? parseFloat(getComputedStyle(bodyEl).paddingRight) || 80 : 80;
      const lineX = w - gutter / 2;
      const amp = window.innerWidth < 720 ? 0 : Math.min(14, gutter * 0.26);

      const pts: { x: number; y: number }[] = [{ x: lineX - amp, y: -90 }];
      const wpPoints: { x: number; y: number }[] = [];
      waypoints.forEach((wp, i) => {
        const cy = wp.row.offsetTop + wp.row.offsetHeight / 2;
        const x = lineX + amp * (i % 2 === 0 ? 1 : -1);
        wp.el.style.left = `${x}px`;
        wp.el.style.top = `${cy}px`;
        const point = { x, y: cy };
        pts.push(point);
        wpPoints.push(point);
      });
      pts.push({ x: lineX + amp, y: h + 54 });

      path.setAttribute("d", splinePath(pts));
      pathLen = path.getTotalLength();
      waypoints.forEach((wp, i) => {
        wp.arc = arcAtPoint(wpPoints[i]);
      });
      lastArc = waypoints[waypoints.length - 1].arc;
    };

    const placeDrone = (arc: number) => {
      const pt = path.getPointAtLength(arc);
      gsap.set(drone, { x: pt.x, y: pt.y });
    };

    buildRoute();
    gsap.set(drone, { xPercent: -50, yPercent: -50, opacity: 0 });

    if (reduceMotion) {
      /* No motion — show the finished route, parked drone and pins. */
      gsap.set(path, { strokeDasharray: "none", strokeDashoffset: 0 });
      gsap.set(drone, { opacity: 1 });
      placeDrone(lastArc);
      waypoints.forEach((wp) => gsap.set(wp.el, { opacity: 1, scale: 1 }));

      ScrollTrigger.addEventListener("refresh", () => {
        buildRoute();
        placeDrone(lastArc);
      });
    } else {
      gsap.set(path, { strokeDasharray: pathLen, strokeDashoffset: pathLen });
      placeDrone(0);

      const rotors = gsap.utils.toArray<SVGCircleElement>(
        drone.querySelectorAll(".services-drone-rotor"),
      );

      let entered = false;
      let done = false;

      /* A pin snaps in with a ripple as the drone passes overhead. */
      const dropWaypoint = (wp: Waypoint) => {
        wp.dropped = true;
        gsap.fromTo(
          wp.el,
          { scale: 0, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.55, ease: "back.out(2.4)" },
        );
        gsap.fromTo(
          wp.ring,
          { scale: 0.5, opacity: 0.75 },
          { scale: 3, opacity: 0, duration: 0.9, ease: "power2.out" },
        );
      };

      /* Once the route is flown, the drone hovers and the path
         settles into a slow marching dash. */
      const startIdle = () => {
        done = true;
        gsap.set(path, { strokeDasharray: "2.4 6" });
        gsap.to(path, {
          strokeDashoffset: -17,
          duration: 2.6,
          ease: "none",
          repeat: -1,
        });
        gsap.to(droneInner, {
          y: 5,
          duration: 1.7,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
        });
        gsap.to(droneInner, {
          rotation: 5,
          duration: 2.3,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
        });
      };

      ScrollTrigger.create({
        trigger: flow,
        start: "top 78%",
        once: true,
        onEnter: () => {
          entered = true;
          buildRoute();
          gsap.set(path, { strokeDasharray: pathLen, strokeDashoffset: pathLen });
          gsap.to(drone, { opacity: 1, duration: 0.4 });

          /* Rotors spin for the whole flight. */
          rotors.forEach((rotor) => {
            const cx = rotor.getAttribute("cx") ?? "0";
            const cy = rotor.getAttribute("cy") ?? "0";
            gsap.to(rotor, {
              rotation: 360,
              svgOrigin: `${cx} ${cy}`,
              duration: 0.5,
              ease: "none",
              repeat: -1,
            });
          });

          if (glow) {
            gsap.fromTo(
              glow,
              { scale: 0.8, opacity: 0.55 },
              {
                scale: 1.3,
                opacity: 0.16,
                duration: 1.8,
                ease: "sine.inOut",
                repeat: -1,
                yoyo: true,
              },
            );
          }

          /* The drone flies down, drawing the path behind it and
             planting a pin at each row. */
          const travel = { p: 0 };
          gsap.to(travel, {
            p: 1,
            duration: 2.7,
            ease: "power1.inOut",
            onUpdate: () => {
              const arc = travel.p * lastArc;
              placeDrone(arc);
              gsap.set(path, { strokeDashoffset: pathLen - arc });
              waypoints.forEach((wp) => {
                if (!wp.dropped && arc >= wp.arc - 0.5) {
                  dropWaypoint(wp);
                }
              });
            },
            onComplete: () => {
              /* Finish drawing the short bleed-off below the last pin. */
              gsap.to(path, {
                strokeDashoffset: 0,
                duration: 0.6,
                ease: "power2.out",
                onComplete: startIdle,
              });
            },
          });
        },
      });

      /* Keep the route in sync when the layout changes. */
      ScrollTrigger.addEventListener("refresh", () => {
        buildRoute();
        if (done) {
          placeDrone(lastArc);
        } else if (!entered) {
          gsap.set(path, { strokeDasharray: pathLen, strokeDashoffset: pathLen });
          placeDrone(0);
        }
      });
    }
  }
}

export {};
