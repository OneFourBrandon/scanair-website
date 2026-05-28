const sampleEmbeds = document.querySelectorAll<HTMLElement>("[data-supersplat-embed]");
const samplesCarousel = document.querySelector<HTMLElement>("[data-carousel]");
const placeholderTemplates = new WeakMap<HTMLElement, Node[]>();
const pendingUnmountTimers = new WeakMap<HTMLElement, number>();
let fullscreenElement: Element | null = null;

const INTERACTION_UNLOAD_GRACE_MS = 120000;

const cancelPendingUnmount = (container: HTMLElement) => {
  window.clearTimeout(pendingUnmountTimers.get(container));
  pendingUnmountTimers.delete(container);
};

const markViewerInteraction = (container: HTMLElement) => {
  container.dataset.viewerActiveUntil = String(Date.now() + INTERACTION_UNLOAD_GRACE_MS);
};

const isEmbedInActiveSlide = (container: HTMLElement) => {
  const slide = container.closest<HTMLElement>("[data-carousel-slide]");

  return !slide || slide.classList.contains("is-active");
};

const applyFallbackImage = (container: HTMLElement) => {
  const fallbackSrc = container.dataset.supersplatFallback?.trim();
  const placeholder = container.querySelector<HTMLElement>(".sample-placeholder");

  if (!fallbackSrc || !placeholder || placeholder.querySelector(".sample-fallback-image")) {
    return;
  }

  const fallbackImage = document.createElement("img");
  fallbackImage.className = "sample-fallback-image";
  fallbackImage.src = fallbackSrc;
  fallbackImage.alt =
    container.dataset.supersplatFallbackAlt ||
    container.dataset.supersplatTitle ||
    "SuperSplat scene preview";
  fallbackImage.loading = "lazy";
  fallbackImage.decoding = "async";

  placeholder.classList.add("has-fallback-image");
  placeholder.insertBefore(fallbackImage, placeholder.firstChild);
};

sampleEmbeds.forEach((container) => {
  applyFallbackImage(container);
  placeholderTemplates.set(
    container,
    Array.from(container.childNodes).map((node) => node.cloneNode(true)),
  );
  container.addEventListener("pointerenter", () => markViewerInteraction(container));
  container.addEventListener("pointerdown", () => markViewerInteraction(container));
  container.addEventListener("focusin", () => markViewerInteraction(container));
});

const mountSuperSplatEmbed = (container: HTMLElement) => {
  const embedSrc = container.dataset.supersplatSrc?.trim();

  if (!embedSrc || container.dataset.embedLoaded === "true") {
    cancelPendingUnmount(container);
    return;
  }

  let embedUrl: URL;

  try {
    embedUrl = new URL(embedSrc, window.location.href);
  } catch {
    console.warn(`Invalid SuperSplat embed URL: ${embedSrc}`);
    return;
  }

  if (embedUrl.hostname === "superspl.at" && !embedUrl.searchParams.has("noui")) {
    embedUrl.searchParams.set("noui", "1");
  }

  const iframe = document.createElement("iframe");
  iframe.src = embedUrl.href;
  iframe.title = container.dataset.supersplatTitle || "ScanAir SuperSplat sample";
  iframe.loading = "lazy";
  iframe.referrerPolicy = "strict-origin-when-cross-origin";
  iframe.allow = "fullscreen *; xr-spatial-tracking; gyroscope; accelerometer";
  iframe.allowFullscreen = true;
  iframe.setAttribute("webkitallowfullscreen", "true");
  iframe.setAttribute("mozallowfullscreen", "true");
  iframe.addEventListener("load", () => markViewerInteraction(container));

  container.dataset.embedLoaded = "true";
  container.classList.add("is-embed-loaded");
  markViewerInteraction(container);
  container.replaceChildren(iframe);
};

const unmountSuperSplatEmbed = (container: HTMLElement, force = false) => {
  if (container.dataset.embedLoaded !== "true") {
    cancelPendingUnmount(container);
    return;
  }

  if (fullscreenElement && container.contains(fullscreenElement)) {
    return;
  }

  const activeUntil = Number(container.dataset.viewerActiveUntil || 0);

  if (!force && activeUntil > Date.now()) {
    cancelPendingUnmount(container);
    pendingUnmountTimers.set(
      container,
      window.setTimeout(() => unmountSuperSplatEmbed(container), activeUntil - Date.now()),
    );
    return;
  }

  const placeholderNodes = placeholderTemplates.get(container) || [];

  cancelPendingUnmount(container);
  delete container.dataset.viewerActiveUntil;
  container.dataset.embedLoaded = "false";
  container.classList.remove("is-embed-loaded");
  container.replaceChildren(...placeholderNodes.map((node) => node.cloneNode(true)));
};

if ("IntersectionObserver" in window) {
  const sampleSection = document.getElementById("samples");
  let isSampleSectionVisible = !sampleSection;
  const embedObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        const container = entry.target;
        embedObserver.unobserve(container);

        if (container instanceof HTMLElement && isEmbedInActiveSlide(container)) {
          mountSuperSplatEmbed(container);
        }
      });
    },
    { rootMargin: "360px 0px" },
  );

  const observeEmbeds = () => {
    sampleEmbeds.forEach((container) => {
      cancelPendingUnmount(container);

      if (!isEmbedInActiveSlide(container)) {
        unmountSuperSplatEmbed(container, true);
        return;
      }

      if (container.dataset.embedLoaded !== "true") {
        embedObserver.observe(container);
      }
    });
  };

  const updateActiveCarouselEmbed = () => {
    if (fullscreenElement) {
      return;
    }

    embedObserver.disconnect();

    sampleEmbeds.forEach((container) => {
      if (isEmbedInActiveSlide(container) && isSampleSectionVisible) {
        cancelPendingUnmount(container);

        if (container.dataset.embedLoaded !== "true") {
          embedObserver.observe(container);
        }
        return;
      }

      unmountSuperSplatEmbed(container, true);
    });
  };

  samplesCarousel?.addEventListener("carousel:change", updateActiveCarouselEmbed);

  document.addEventListener("fullscreenchange", () => {
    fullscreenElement = document.fullscreenElement;

    if (fullscreenElement) {
      embedObserver.disconnect();
      return;
    }

    if (isSampleSectionVisible) {
      updateActiveCarouselEmbed();
      return;
    }

    sampleEmbeds.forEach((container) => unmountSuperSplatEmbed(container, true));
  });

  if (sampleSection) {
    const sectionObserver = new IntersectionObserver((entries) => {
      if (fullscreenElement) {
        return;
      }

      isSampleSectionVisible = entries.some((entry) => entry.isIntersecting);

      if (isSampleSectionVisible) {
        updateActiveCarouselEmbed();
        return;
      }

      embedObserver.disconnect();
      sampleEmbeds.forEach((container) => unmountSuperSplatEmbed(container, true));
    });

    sectionObserver.observe(sampleSection);
  } else {
    observeEmbeds();
  }
} else {
  sampleEmbeds.forEach(mountSuperSplatEmbed);
}

export {};
