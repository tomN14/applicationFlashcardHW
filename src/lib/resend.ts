/**
 * SERVER ONLY — do not import this module from Client Components. It reads
 * `RESEND_API_KEY`, which must not use a `NEXT_PUBLIC_` prefix.
 */
import { Resend } from "resend";

let resend: Resend | null = null;

export function getResend(): Resend {
  if (!resend) {
    const key = process.env.RESEND_API_KEY;
    if (!key) {
      throw new Error("RESEND_API_KEY is not set");
    }
    resend = new Resend(key);
  }
  return resend;
}
