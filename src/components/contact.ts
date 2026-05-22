const decodeContact = (encoded: number[]) =>
  encoded.map((value, index) => String.fromCharCode(value - ((index % 7) + 3))).join("");

const email = decodeContact([
  113, 102, 104, 110, 112, 120, 124, 112, 109, 121, 110, 122, 72, 112, 112, 101,
  110, 114, 53, 107, 120, 112,
]);

const emailHref = `mailto:${email}`;

const phone = decodeContact([58, 52, 58, 51, 63, 60, 62, 48, 58, 59, 54, 58]);

const phoneHref = `tel:${phone.replace(/\D/g, "")}`;

const emailTarget = document.querySelector<HTMLElement>('[data-contact-value="email"]');
const emailRevealButton = document.querySelector<HTMLButtonElement>("[data-email-reveal]");

const revealEmail = () => {
  if (!emailTarget) {
    return;
  }

  const link = document.createElement("a");
  link.href = emailHref;
  link.textContent = email;
  link.setAttribute("aria-label", `Email address: ${email}`);

  emailTarget.replaceChildren(link);
};

emailRevealButton?.addEventListener("click", revealEmail);

document.querySelectorAll<HTMLButtonElement>("[data-reveal-contact]").forEach((button) => {
  button.addEventListener("click", () => {
    const targetId = button.getAttribute("aria-controls");
    const target = targetId ? document.getElementById(targetId) : null;
    if (!target) {
      return;
    }

    const isPhone = button.dataset.revealContact === "phone";
    const link = document.createElement("a");
    link.href = isPhone ? phoneHref : emailHref;
    link.textContent = isPhone ? phone : email;
    link.setAttribute("aria-label", `${isPhone ? "Phone number" : "Email address"}: ${link.textContent}`);

    target.replaceChildren(link);
    target.hidden = false;
    button.hidden = true;
    button.setAttribute("aria-expanded", "true");
  });
});

const contactForm = document.querySelector<HTMLFormElement>("[data-contact-form]");

contactForm?.addEventListener("submit", (event) => {
  event.preventDefault();

  if (!contactForm.reportValidity()) {
    return;
  }

  const formData = new FormData(contactForm);
  const name = String(formData.get("name") || "Website visitor").trim();
  const replyEmail = String(formData.get("email") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const projectType = String(formData.get("project_type") || "").trim();
  const message = String(formData.get("message") || "").trim();
  const subject = `ScanAir project inquiry from ${name}`;
  const body = [
    `Name: ${name}`,
    `Email: ${replyEmail}`,
    `Phone: ${phone || "Not provided"}`,
    `Project type: ${projectType || "Not provided"}`,
    "",
    "Message:",
    message,
  ].join("\n");

  window.location.href = `${emailHref}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
});
