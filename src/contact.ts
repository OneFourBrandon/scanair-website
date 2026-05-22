const decodeContact = (encoded: number[]) =>
  encoded.map((value, index) => String.fromCharCode(value - ((index % 7) + 3))).join("");

const email = decodeContact([
  113, 102, 104, 110, 112, 120, 124, 112, 109, 121, 110, 122, 72, 112, 112, 101,
  110, 114, 53, 107, 120, 112,
]);

const emailHref = `mailto:${email}`;

const emailTarget = document.querySelector<HTMLElement>('[data-contact-value="email"]');

if (emailTarget) {
  const link = document.createElement("a");
  link.href = emailHref;
  link.textContent = email;
  link.setAttribute("aria-label", `Email address: ${email}`);

  emailTarget.replaceChildren(link);
}

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
