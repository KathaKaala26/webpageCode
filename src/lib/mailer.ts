import nodemailer from "nodemailer";

let warned = false;

function transport() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) {
    if (!warned) {
      console.warn("[mailer] GMAIL_USER/GMAIL_APP_PASSWORD not set — enquiry notification emails are disabled.");
      warned = true;
    }
    return null;
  }
  return nodemailer.createTransport({ service: "gmail", auth: { user, pass } });
}

/** Emails the configured business inbox about a new enquiry. No-ops (logs once) if mail isn't configured. */
export async function sendEnquiryNotification({
  name,
  email,
  message,
  page,
}: {
  name: string;
  email: string;
  message: string;
  page: string | null;
}): Promise<void> {
  const t = transport();
  if (!t) return;

  const to = process.env.CONTACT_NOTIFY_EMAIL || process.env.GMAIL_USER!;
  await t.sendMail({
    from: `"Katha & Kaala website" <${process.env.GMAIL_USER}>`,
    to,
    replyTo: email,
    subject: `New enquiry from ${name}${page ? ` (${page})` : ""}`,
    text: `Name: ${name}\nEmail: ${email}\nPage: ${page ?? "—"}\n\n${message}`,
  });
}
