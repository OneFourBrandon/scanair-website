const decodeContact = (encoded: number[]) =>
  encoded.map((value, index) => String.fromCharCode(value - ((index % 7) + 3))).join("");

const email = decodeContact([
  102, 115, 115, 122, 104, 107, 125, 67, 119, 104, 103, 117, 105, 114, 117, 50,
  104, 103,
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
const contactFormStatus = document.querySelector<HTMLElement>("[data-contact-form-status]");

contactForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!contactForm.reportValidity()) {
    return;
  }

  const formData = new FormData(contactForm);
  const submitButton = contactForm.querySelector<HTMLButtonElement>('button[type="submit"]');
  const originalButtonText = submitButton?.textContent || "Send Message";

  setContactFormStatus("Sending message...", "pending");

  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = "Sending...";
  }

  try {
    const response = await fetch(contactForm.action, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(Object.fromEntries(formData.entries())),
    });
    const result = await readContactResponse(response);

    if (response.status === 503) {
      openMailFallback(formData);
      setContactFormStatus(
        "Email delivery is not connected on the website yet, so we opened an email draft instead.",
        "success",
      );
      return;
    }

    if (!response.ok) {
      throw new Error(result.message || "We could not send the message right now.");
    }

    contactForm.reset();
    setContactFormStatus("Message sent. We will reply after reviewing the project details.", "success");
  } catch (error) {
    setContactFormStatus(
      error instanceof Error
        ? error.message
        : "We could not send the message right now. Please try again shortly.",
      "error",
    );
  } finally {
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = originalButtonText;
    }
  }
});

function setContactFormStatus(message: string, state: "pending" | "success" | "error") {
  if (!contactFormStatus) {
    return;
  }

  contactFormStatus.textContent = message;
  contactFormStatus.dataset.state = state;
}

function openMailFallback(formData: FormData) {
  const name = formValue(formData, "name") || "Website visitor";
  const senderEmail = formValue(formData, "email");
  const phoneValue = formValue(formData, "phone") || "Not provided";
  const projectType = formValue(formData, "project_type") || "Not selected";
  const message = formValue(formData, "message");
  const subject = `ScanAir project inquiry from ${name}`;
  const body = [
    "New ScanAir website inquiry",
    "",
    `Name: ${name}`,
    `Email: ${senderEmail}`,
    `Phone: ${phoneValue}`,
    `Project type: ${projectType}`,
    "",
    "Message:",
    message,
  ].join("\n");

  window.location.href = `${emailHref}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function formValue(formData: FormData, key: string): string {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

async function readContactResponse(response: Response): Promise<{ message?: string }> {
  try {
    return await response.json();
  } catch {
    return {};
  }
}
