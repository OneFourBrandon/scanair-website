const headerMount = document.querySelector<HTMLElement>("[data-site-header]");

const isHomePage = () => {
  const path = window.location.pathname.replace(/\/+$/, "") || "/";
  return path === "/" || path === "/index" || path === "/index.html";
};

const sectionHref = (id: string) => (isHomePage() ? `#${id}` : `/#${id}`);

if (headerMount) {
  const header = document.createElement("header");
  header.className = "site-header";
  header.setAttribute("aria-label", "Primary navigation");
  header.innerHTML = `
    <a class="brand" href="/" aria-label="ScanAir home">
      <img src="/assets/scanair-logo-red.png" alt="ScanAir" />
      <span class="brand-word" aria-hidden="true">Scan<span>Air</span></span>
    </a>
    <nav class="nav-links" aria-label="Main navigation">
      <a href="${sectionHref("services")}">Services</a>
      <a href="${sectionHref("samples")}">3D Gaussian Mapping</a>
      <a href="${sectionHref("ortho-mapping")}">Ortho Mapping</a>
      <a href="${sectionHref("process")}">Process</a>
      <a href="${sectionHref("solutions")}">Use Cases</a>
      <a href="https://path.scanair.ca/">DJI Path Creator</a>
    </nav>
    <div class="nav-actions">
      <a class="button button-primary nav-cta" href="/contact">Contact Us</a>
      <button
        class="nav-toggle"
        type="button"
        aria-label="Open menu"
        aria-expanded="false"
        aria-controls="mobile-menu"
        data-nav-toggle
      >
        <span class="nav-toggle-box" aria-hidden="true">
          <span class="nav-toggle-bar"></span>
          <span class="nav-toggle-bar"></span>
          <span class="nav-toggle-bar"></span>
        </span>
      </button>
    </div>
    <nav class="mobile-menu" id="mobile-menu" aria-label="Mobile navigation">
      <a href="${sectionHref("services")}">Services</a>
      <a href="${sectionHref("samples")}">3D Gaussian Mapping</a>
      <a href="${sectionHref("ortho-mapping")}">Ortho Mapping</a>
      <a href="${sectionHref("process")}">Process</a>
      <a href="${sectionHref("solutions")}">Use Cases</a>
      <a href="https://path.scanair.ca/">DJI Path Creator</a>
      <a class="button button-primary" href="/contact">Contact Us</a>
    </nav>
  `;

  headerMount.replaceWith(header);
}

export {};
