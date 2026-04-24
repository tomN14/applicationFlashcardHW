"use server";

import { getResend } from "@/lib/resend";

export type SendEmailResult =
  | { success: true }
  | { success: false; error: string };

/** Placeholder: contact / transactional email via Resend */
export async function sendContactEmail(
  formData: FormData,
): Promise<SendEmailResult> {
  const from = process.env.RESEND_FROM_EMAIL;
  const to = process.env.CONTACT_INBOX_EMAIL;

  if (!from || !to) {
    return {
      success: false,
      error:
        "RESEND_FROM_EMAIL and CONTACT_INBOX_EMAIL must be set on the server.",
    };
  }

  const email = formData.get("email");
  const message = formData.get("message");

  if (typeof email !== "string" || !email.trim()) {
    return { success: false, error: "Email is required." };
  }
  if (typeof message !== "string" || !message.trim()) {
    return { success: false, error: "Message is required." };
  }

  try {
    const resend = getResend();
    const { error } = await resend.emails.send({
      from,
      to,
      subject: "Contact form — Recall",
      replyTo: email.trim(),
      text: message.trim(),
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to send email.";
    return { success: false, error: msg };
  }
}

export async function submitContactForm(formData: FormData): Promise<void> {
  await sendContactEmail(formData);
}

/** Placeholder: persist flashcard edits when schema exists */
export async function updateFlashcard(_formData: FormData): Promise<void> {
  void _formData;
}

/** Placeholder: remove a flashcard when schema exists */
export async function deleteFlashcard(_cardId: string): Promise<void> {
  void _cardId;
}
