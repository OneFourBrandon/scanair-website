const footerMount = document.querySelector<HTMLElement>("[data-site-footer]");

const isHomePage = () => {
  const path = window.location.pathname.replace(/\/+$/, "") || "/";
  return path === "/" || path === "/index" || path === "/index.html";
};

const sectionHref = (id: string) => (isHomePage() ? `#${id}` : `/#${id}`);

if (footerMount) {
  const footer = document.createElement("footer");
  footer.className = "site-footer";
  footer.id = "contact";
  footer.innerHTML = `
    <div class="footer-top">
      <div class="footer-brand-block">
        <a class="footer-brand" href="/" aria-label="ScanAir home">
          <img src="/assets/scanair-logo-red.png" alt="ScanAir" />
          <span class="brand-word" aria-hidden="true">Scan<span>Air</span></span>
        </a>
        <p>Local drone scanning, exterior documentation, and planning visuals for North Bay, Ontario & surrounding areas.</p>
      </div>
      <nav class="footer-col" aria-label="Footer navigation">
        <p class="footer-heading">Navigate</p>
        <a href="${sectionHref("services")}">Services</a>
        <a href="${sectionHref("samples")}">3D Gaussian Mapping</a>
        <a href="/listings">Listings</a>
        <a href="${sectionHref("ortho-mapping")}">Ortho Mapping</a>
        <a href="${sectionHref("process")}">Process</a>
        <a href="${sectionHref("solutions")}">Use Cases</a>
      </nav>
      <div class="footer-col">
        <p class="footer-heading">Get in touch</p>
        <a href="/contact">Contact ScanAir</a>
        <a href="https://path.scanair.ca">DJI Path Creator</a>
        <span class="footer-note">North Bay, Ontario</span>
        <div class="footer-legal">
          <a href="/privacy">Privacy Policy</a>
          <a href="/terms">Terms of Service</a>
        </div>
      </div>
    </div>
    <div class="footer-base">
      <span>&copy; 2026 ScanAir</span>
      <span>Drone services &amp; spatial software</span>
    </div>
  `;

  footerMount.replaceWith(footer);
}

export {};
