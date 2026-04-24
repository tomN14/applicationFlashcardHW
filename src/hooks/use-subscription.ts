"use client";

import { useCallback, useState } from "react";

export type SubscriptionStatus =
  | "inactive"
  | "trialing"
  | "active"
  | "past_due"
  | "canceled";

export type UseSubscriptionResult = {
  status: SubscriptionStatus;
  isLoading: boolean;
  /** Replace with Stripe Customer Portal or billing API call */
  refresh: () => void;
};

/**
 * Placeholder: load subscription from your API route or Supabase + Stripe metadata.
 */
export function useSubscription(): UseSubscriptionResult {
  const [isLoading] = useState(false);
  const [, bump] = useState(0);
  const refresh = useCallback(() => bump((n) => n + 1), []);

  return {
    status: "inactive",
    isLoading,
    refresh,
  };
}
