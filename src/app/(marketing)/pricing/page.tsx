import { startProCheckout } from "@/app/actions/stripe";

type PricingPageProps = {
  searchParams?: Promise<{ error?: string }>;
};

export default async function PricingPage({ searchParams }: PricingPageProps) {
  const params = await searchParams;
  const error = params?.error;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Pricing
      </h1>
      <p className="text-zinc-600 dark:text-zinc-400">
        Placeholder pricing surface. Checkout uses Stripe (
        <code className="rounded bg-zinc-100 px-1 text-sm dark:bg-zinc-800">
          createCheckoutSession
        </code>
        ); set{" "}
        <code className="rounded bg-zinc-100 px-1 text-sm dark:bg-zinc-800">
          STRIPE_PRICE_ID_PRO
        </code>{" "}
        on the server and{" "}
        <code className="rounded bg-zinc-100 px-1 text-sm dark:bg-zinc-800">
          NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
        </code>{" "}
        if you use Stripe.js on the client.
      </p>
      {error ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-950 dark:text-red-200">
          {error}
        </p>
      ) : null}
      <section className="rounded-xl border border-zinc-200 p-6 dark:border-zinc-800">
        <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
          Pro (placeholder)
        </h2>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          AI deck generation, sharing, and priority support — details TBD.
        </p>
        <form action={startProCheckout} className="mt-4">
          <button
            type="submit"
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Start checkout (placeholder)
          </button>
        </form>
      </section>
    </div>
  );
}
