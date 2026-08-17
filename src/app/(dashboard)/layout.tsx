import { isGuestUser, requireUser } from "@/lib/session";
import { Sidebar, type Account } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  const guest = isGuestUser(user);

  // The chrome is client-rendered, so the identity is resolved here and passed
  // down rather than re-fetched over /api/auth/me on every navigation.
  const account: Account = {
    name:
      (user.user_metadata?.name as string | undefined) ??
      (guest ? "Guest" : user.email?.split("@")[0]) ??
      "Student",
    email: guest ? "Not signed in" : (user.email ?? ""),
    isGuest: guest,
  };

  return (
    <div className="flex min-h-screen">
      <div className="sticky top-0 hidden h-screen shrink-0 md:block">
        <Sidebar account={account} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <Header account={account} />
        <main className="mx-auto w-full max-w-6xl flex-1 p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
