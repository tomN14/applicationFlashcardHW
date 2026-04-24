/**
 * SERVER ONLY — do not import this module from Client Components. It reads
 * `STRIPE_SECRET_KEY` and related secrets; never use `NEXT_PUBLIC_` for those.
 */
import Stripe from "stripe";

let stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error("STRIPE_SECRET_KEY is not set");
    }
    stripe = new Stripe(key);
  }
  return stripe;
}
