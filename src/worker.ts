type ContactPayload = {
  name?: unknown;
  email?: unknown;
  phone?: unknown;
  project_type?: unknown;
  message?: unknown;
  company_website?: unknown;
};

type ContactSubmission = {
  name: string;
  email: string;
  phone: string;
  projectType: string;
  message: string;
};

type WorkerEnv = Env & {
  BREVO_API_KEY?: string;
};

const BREVO_SEND_EMAIL_URL = "https://api.brevo.com/v3/smtp/email";
const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
};

export default {
  async fetch(request, env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api/contact") {
      return handleContactRequest(request, env);
    }

    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<WorkerEnv>;

async function handleContactRequest(request: Request, env: WorkerEnv): Promise<Response> {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: JSON_HEADERS });
  }

  if (request.method !== "POST") {
    return jsonResponse({ message: "Method not allowed." }, 405);
  }

  if (!env.BREVO_API_KEY) {
    console.error("Missing BREVO_API_KEY secret.");
    return jsonResponse({ message: "Contact form is not configured yet." }, 503);
  }

  let payload: ContactPayload;

  try {
    payload = await request.json<ContactPayload>();
  } catch {
    return jsonResponse({ message: "Please send valid form details." }, 400);
  }

  if (stringValue(payload.company_website)) {
    return jsonResponse({ ok: true });
  }

  const submission = normalizeSubmission(payload);
  const validationMessage = validateSubmission(submission);

  if (validationMessage) {
    return jsonResponse({ message: validationMessage }, 400);
  }

  const brevoResponse = await fetch(BREVO_SEND_EMAIL_URL, {
    method: "POST",
    headers: {
      accept: "application/json",
      "api-key": env.BREVO_API_KEY,
      "content-type": "application/json",
    },
    body: JSON.stringify(createBrevoEmail(submission, env, request)),
  });

  if (!brevoResponse.ok) {
    const errorText = await brevoResponse.text();
    console.error("Brevo contact email failed", {
      status: brevoResponse.status,
      response: errorText.slice(0, 500),
    });

    return jsonResponse(
      { message: "We could not send the message right now. Please try again shortly." },
      502,
    );
  }

  return jsonResponse({ ok: true });
}

function normalizeSubmission(payload: ContactPayload): ContactSubmission {
  return {
    name: stringValue(payload.name) || "Website visitor",
    email: stringValue(payload.email),
    phone: stringValue(payload.phone),
    projectType: stringValue(payload.project_type),
    message: stringValue(payload.message),
  };
}

function validateSubmission(submission: ContactSubmission): string {
  if (!submission.name || submission.name.length > 120) {
    return "Please enter your name.";
  }

  if (!isValidEmail(submission.email)) {
    return "Please enter a valid email address.";
  }

  if (!submission.projectType || submission.projectType.length > 120) {
    return "Please select a project type.";
  }

  if (submission.phone.length > 60) {
    return "Please shorten the phone number.";
  }

  if (submission.message.length < 10) {
    return "Please include a little more detail about the project.";
  }

  if (submission.message.length > 4000) {
    return "Please shorten the message.";
  }

  return "";
}

function createBrevoEmail(submission: ContactSubmission, env: WorkerEnv, request: Request) {
  const submittedAt = new Date().toISOString();
  const sourceUrl = request.headers.get("referer") || "Direct website form";
  const subject = `ScanAir project inquiry from ${submission.name}`;
  const textContent = [
    "New ScanAir website inquiry",
    "",
    `Name: ${submission.name}`,
    `Email: ${submission.email}`,
    `Phone: ${submission.phone || "Not provided"}`,
    `Project type: ${submission.projectType}`,
    `Submitted: ${submittedAt}`,
    `Source: ${sourceUrl}`,
    "",
    "Message:",
    submission.message,
  ].join("\n");

  return {
    sender: {
      name: env.CONTACT_FROM_NAME || "ScanAir Website",
      email: env.CONTACT_FROM_EMAIL,
    },
    to: [
      {
        email: env.CONTACT_TO_EMAIL,
        name: "ScanAir",
      },
    ],
    replyTo: {
      email: submission.email,
      name: submission.name,
    },
    subject,
    textContent,
    htmlContent: createHtmlEmail(submission, submittedAt, sourceUrl),
    tags: ["website-contact"],
  };
}

function createHtmlEmail(
  submission: ContactSubmission,
  submittedAt: string,
  sourceUrl: string,
): string {
  return `
    <h2>New ScanAir website inquiry</h2>
    <p><strong>Name:</strong> ${escapeHtml(submission.name)}</p>
    <p><strong>Email:</strong> ${escapeHtml(submission.email)}</p>
    <p><strong>Phone:</strong> ${escapeHtml(submission.phone || "Not provided")}</p>
    <p><strong>Project type:</strong> ${escapeHtml(submission.projectType)}</p>
    <p><strong>Submitted:</strong> ${escapeHtml(submittedAt)}</p>
    <p><strong>Source:</strong> ${escapeHtml(sourceUrl)}</p>
    <hr>
    <p><strong>Message</strong></p>
    <p>${escapeHtml(submission.message).replace(/\n/g, "<br>")}</p>
  `;
}

function stringValue(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    switch (character) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      default:
        return "&#39;";
    }
  });
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: JSON_HEADERS,
  });
}
