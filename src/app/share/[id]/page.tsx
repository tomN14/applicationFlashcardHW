import Link from "next/link";

type SharePageProps = {
  params: Promise<{ id: string }>;
};

export default async function SharePage({ params }: SharePageProps) {
  const { id } = await params;

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-6 py-10">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Shared deck
      </h1>
      <p className="text-zinc-600 dark:text-zinc-400">
        Public surface (placeholder): read-only view for share link{" "}
        <code className="rounded bg-zinc-100 px-1 text-sm dark:bg-zinc-800">
          {id}
        </code>
        . Load deck + cards from Supabase by share token or id.
      </p>
      <p className="text-sm text-zinc-500">
        <Link href="/" className="underline">
          Home
        </Link>
      </p>
    </div>
  );
}
