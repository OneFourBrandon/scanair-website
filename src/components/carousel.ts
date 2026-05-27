const carousel = document.querySelector<HTMLElement>("[data-carousel]");

if (carousel) {
  const track = carousel.querySelector<HTMLElement>("[data-carousel-track]");
  const slides = Array.from(carousel.querySelectorAll<HTMLElement>("[data-carousel-slide]"));
  const prevBtn = carousel.querySelector<HTMLButtonElement>("[data-carousel-prev]");
  const nextBtn = carousel.querySelector<HTMLButtonElement>("[data-carousel-next]");
  const count = carousel.querySelector<HTMLElement>("[data-carousel-count]");
  const fill = carousel.querySelector<HTMLElement>("[data-carousel-fill]");

  if (track && slides.length > 0) {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let activeIndex = 0;
    let isAnimating = false;

    const render = (index: number) => {
      activeIndex = Math.max(0, Math.min(slides.length - 1, index));

      slides.forEach((slide, i) => {
        slide.classList.toggle("is-active", i === activeIndex);
        slide.toggleAttribute("data-carousel-active", i === activeIndex);
      });

      carousel.dataset.activeSlide = String(activeIndex);
      carousel.dispatchEvent(
        new CustomEvent("carousel:change", {
          detail: {
            activeIndex,
          },
        }),
      );

      if (count) {
        count.textContent = String(activeIndex + 1).padStart(2, "0");
      }
      if (fill) {
        fill.style.width = `${((activeIndex + 1) / slides.length) * 100}%`;
      }
      if (prevBtn) {
        prevBtn.disabled = activeIndex === 0;
      }
      if (nextBtn) {
        nextBtn.disabled = activeIndex === slides.length - 1;
      }
    };

    /* Scroll offset that centres a given slide in the track. */
    const slideTarget = (index: number) => {
      const slide = slides[index];
      return slide.offsetLeft + slide.offsetWidth / 2 - track.clientWidth / 2;
    };

    const centerActiveSlide = () => {
      const maxLeft = track.scrollWidth - track.clientWidth;
      track.scrollLeft = Math.max(0, Math.min(maxLeft, slideTarget(activeIndex)));
    };

    /* Index of the slide nearest the centre of the viewport. */
    const closestIndex = () => {
      const center = track.scrollLeft + track.clientWidth / 2;
      let best = 0;
      let bestDistance = Infinity;

      slides.forEach((slide, i) => {
        const distance = Math.abs(slide.offsetLeft + slide.offsetWidth / 2 - center);
        if (distance < bestDistance) {
          bestDistance = distance;
          best = i;
        }
      });

      return best;
    };

    /* Time-based eased scroll — resilient to dropped frames. */
    let animId = 0;
    const animateTo = (left: number) => {
      const maxLeft = track.scrollWidth - track.clientWidth;
      const to = Math.max(0, Math.min(maxLeft, left));

      if (animId) {
        cancelAnimationFrame(animId);
        animId = 0;
      }

      if (reduceMotion) {
        track.scrollLeft = to;
        return;
      }

      const from = track.scrollLeft;
      const distance = to - from;
      if (Math.abs(distance) < 1) {
        return;
      }

      const duration = 480;
      const start = performance.now();
      const ease = (t: number) => 1 - Math.pow(1 - t, 3);
      isAnimating = true;

      const step = (now: number) => {
        const progress = Math.min(1, (now - start) / duration);
        track.scrollLeft = from + distance * ease(progress);

        if (progress < 1) {
          animId = requestAnimationFrame(step);
        } else {
          animId = 0;
          isAnimating = false;
        }
      };

      animId = requestAnimationFrame(step);
    };

    const goToSlide = (index: number) => {
      const clamped = Math.max(0, Math.min(slides.length - 1, index));
      render(clamped);
      animateTo(slideTarget(clamped));
    };

    let rafId = 0;
    let snapTimer = 0;
    track.addEventListener(
      "scroll",
      () => {
        if (!rafId) {
          rafId = requestAnimationFrame(() => {
            rafId = 0;
            render(closestIndex());
          });
        }

        /* Once a free scroll settles, ease the nearest slide to centre. */
        window.clearTimeout(snapTimer);
        snapTimer = window.setTimeout(() => {
          if (isAnimating) {
            return;
          }
          const index = closestIndex();
          if (Math.abs(slideTarget(index) - track.scrollLeft) > 2) {
            animateTo(slideTarget(index));
          }
        }, 160);
      },
      { passive: true },
    );

    prevBtn?.addEventListener("click", () => goToSlide(activeIndex - 1));
    nextBtn?.addEventListener("click", () => goToSlide(activeIndex + 1));

    render(0);
    requestAnimationFrame(() => {
      centerActiveSlide();
      requestAnimationFrame(centerActiveSlide);
    });

    window.addEventListener("load", centerActiveSlide, { once: true });
    window.addEventListener("resize", centerActiveSlide);
    void document.fonts?.ready.then(centerActiveSlide);
  }
}

export {};
