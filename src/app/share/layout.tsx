export default function ShareLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-full flex-1">{children}</div>;
}
