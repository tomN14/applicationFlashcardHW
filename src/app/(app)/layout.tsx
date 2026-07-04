import { AppShell } from "@/components/layout/app-shell";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { getServerAuthUser } from "@/lib/auth/session";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getServerAuthUser();

  return (
    <ThemeProvider
      activeColorScheme={user?.activeColorScheme ?? "default"}
      savedColorSchemes={user?.savedColorSchemes ?? []}
    >
      <AppShell user={user}>{children}</AppShell>
    </ThemeProvider>
  );
}
