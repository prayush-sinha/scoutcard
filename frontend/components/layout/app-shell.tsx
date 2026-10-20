import { Sidebar } from "./sidebar";
import { MobileTabBar } from "./mobile-tab-bar";

/**
 * Desktop: fixed left sidebar. Mobile: bottom tab bar
 * (most players open this from Discord on a phone).
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="min-h-screen pb-24 lg:ml-64 lg:pb-0">
        <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</div>
      </main>
      <MobileTabBar />
    </div>
  );
}
