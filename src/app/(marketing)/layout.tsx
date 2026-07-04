import { MarketingNav } from "@/components/layout/marketing-nav";
import { getServerAuthUser } from "@/lib/auth/session";

export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getServerAuthUser();

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <MarketingNav user={user} />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-6 py-10">
        {children}
      </main>
    </div>
  );
}
