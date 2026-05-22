const sampleEmbeds = document.querySelectorAll<HTMLElement>("[data-supersplat-embed]");

const mountSuperSplatEmbed = (container: HTMLElement) => {
  const embedSrc = container.dataset.supersplatSrc?.trim();

  if (!embedSrc || container.dataset.embedLoaded === "true") {
    return;
  }

  let embedUrl: URL;

  try {
    embedUrl = new URL(embedSrc, window.location.href);
  } catch {
    console.warn(`Invalid SuperSplat embed URL: ${embedSrc}`);
    return;
  }

  const iframe = document.createElement("iframe");
  iframe.src = embedUrl.href;
  iframe.title = container.dataset.supersplatTitle || "ScanAir SuperSplat sample";
  iframe.loading = "lazy";
  iframe.referrerPolicy = "strict-origin-when-cross-origin";
  iframe.allow = "fullscreen; xr-spatial-tracking; gyroscope; accelerometer";
  iframe.allowFullscreen = true;

  container.dataset.embedLoaded = "true";
  container.classList.add("is-embed-loaded");
  container.replaceChildren(iframe);
};

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        const container = entry.target;
        observer.unobserve(container);

        if (container instanceof HTMLElement) {
          mountSuperSplatEmbed(container);
        }
      });
    },
    { rootMargin: "360px 0px" },
  );

  sampleEmbeds.forEach((container) => observer.observe(container));
} else {
  sampleEmbeds.forEach(mountSuperSplatEmbed);
}

export {};
