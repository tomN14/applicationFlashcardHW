import { MarketingNav } from "@/components/layout/marketing-nav";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <MarketingNav />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-6 py-10">
        {children}
      </main>
    </div>
  );
}
