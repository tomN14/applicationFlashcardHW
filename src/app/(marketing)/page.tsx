import Link from "next/link";

export default function MarketingPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        Recall
      </h1>
      <p className="text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
        Marketing surface (placeholder): an AI-powered flashcard platform with
        sharing, billing, and email — built on Next.js, Supabase, Stripe,
        Resend, and OpenAI.
      </p>
      <div className="flex flex-wrap gap-4 text-sm font-medium">
        <Link
          href="/pricing"
          className="rounded-full bg-zinc-900 px-4 py-2 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          View pricing
        </Link>
        <Link
          href="/contact"
          className="rounded-full border border-zinc-300 px-4 py-2 text-zinc-900 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-50 dark:hover:bg-zinc-900"
        >
          Contact
        </Link>
      </div>
    </div>
  );
}
