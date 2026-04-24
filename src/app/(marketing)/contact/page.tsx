import { submitContactForm } from "@/app/actions/cards";

export default function ContactPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Contact
      </h1>
      <p className="text-zinc-600 dark:text-zinc-400">
        Placeholder: this form uses{" "}
        <code className="rounded bg-zinc-100 px-1 text-sm dark:bg-zinc-800">
          submitContactForm
        </code>{" "}
        (
        <code className="rounded bg-zinc-100 px-1 text-sm dark:bg-zinc-800">
          actions/cards.ts
        </code>{" "}
        · Resend). Configure{" "}
        <code className="rounded bg-zinc-100 px-1 text-sm dark:bg-zinc-800">
          RESEND_FROM_EMAIL
        </code>{" "}
        and{" "}
        <code className="rounded bg-zinc-100 px-1 text-sm dark:bg-zinc-800">
          CONTACT_INBOX_EMAIL
        </code>{" "}
        on the server.
      </p>
      <form action={submitContactForm} className="flex max-w-md flex-col gap-3">
        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Email
          <input
            type="email"
            name="email"
            required
            className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50"
            placeholder="you@example.com"
          />
        </label>
        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Message
          <textarea
            name="message"
            required
            rows={4}
            className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50"
            placeholder="How can we help?"
          />
        </label>
        <button
          type="submit"
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Send (placeholder)
        </button>
      </form>
    </div>
  );
}
