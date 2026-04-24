"use server";

import { redirect } from "next/navigation";
import { getStripe } from "@/lib/stripe";

export type CheckoutSessionResult =
  | { success: true; url: string }
  | { success: false; error: string };

export async function createCheckoutSession(): Promise<CheckoutSessionResult> {
  const priceId = process.env.STRIPE_PRICE_ID_PRO;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!priceId) {
    return {
      success: false,
      error: "STRIPE_PRICE_ID_PRO is not set.",
    };
  }
  if (!appUrl) {
    return {
      success: false,
      error: "NEXT_PUBLIC_APP_URL is not set.",
    };
  }

  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/dashboard?checkout=success`,
      cancel_url: `${appUrl}/pricing?checkout=cancel`,
    });

    if (!session.url) {
      return { success: false, error: "Checkout session missing redirect URL." };
    }

    return { success: true, url: session.url };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Checkout failed.";
    return { success: false, error: msg };
  }
}

export type PortalSessionResult =
  | { success: true; url: string }
  | { success: false; error: string };

export async function createBillingPortalSession(
  stripeCustomerId: string,
): Promise<PortalSessionResult> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!stripeCustomerId.trim()) {
    return { success: false, error: "Customer id is required." };
  }
  if (!appUrl) {
    return {
      success: false,
      error: "NEXT_PUBLIC_APP_URL is not set.",
    };
  }

  try {
    const stripe = getStripe();
    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${appUrl}/dashboard`,
    });

    return { success: true, url: session.url };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Portal session failed.";
    return { success: false, error: msg };
  }
}

export async function startProCheckout() {
  const result = await createCheckoutSession();
  if (result.success) {
    redirect(result.url);
  }
  redirect(`/pricing?error=${encodeURIComponent(result.error)}`);
}
