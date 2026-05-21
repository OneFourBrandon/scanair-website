type ContactChannel = "email" | "phone";

const decodeContact = (encoded: number[]) =>
  encoded.map((value, index) => String.fromCharCode(value - ((index % 7) + 3))).join("");

const contacts: Record<ContactChannel, string> = {
  email: decodeContact([
    113, 102, 104, 110, 112, 120, 124, 112, 109, 121, 110, 122, 72, 112, 112, 101,
    110, 114, 53, 107, 120, 112,
  ]),
  phone: decodeContact([58, 52, 58, 51, 63, 60, 62, 48, 58, 59, 54, 58]),
};

const hrefFor = (channel: ContactChannel, value: string) => {
  if (channel === "email") {
    return `mailto:${value}`;
  }

  return `tel:${value.replace(/[^\d+]/g, "")}`;
};

const labelFor = (channel: ContactChannel) => (channel === "email" ? "Email address" : "Phone number");

document.querySelectorAll<HTMLButtonElement>("[data-reveal-contact]").forEach((button) => {
  const channel = button.dataset.revealContact as ContactChannel | undefined;

  if (!channel || !(channel in contacts)) {
    return;
  }

  button.addEventListener(
    "click",
    () => {
      const value = contacts[channel];
      const valueTarget = document.querySelector<HTMLElement>(`[data-contact-value="${channel}"]`);

      if (!valueTarget) {
        return;
      }

      const link = document.createElement("a");
      link.href = hrefFor(channel, value);
      link.textContent = value;
      link.setAttribute("aria-label", `${labelFor(channel)}: ${value}`);

      valueTarget.replaceChildren(link);
      valueTarget.hidden = false;
      button.setAttribute("aria-expanded", "true");
      button.hidden = true;
    },
    { once: true },
  );
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

  window.location.href = `${hrefFor("email", contacts.email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
});
