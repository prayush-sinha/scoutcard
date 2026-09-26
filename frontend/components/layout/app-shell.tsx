import { Sidebar } from "./sidebar";

/**
 * Persistent left sidebar (w-64) + a centered, max-width main area so
 * content stays readable on ultrawide monitors while remaining fluid
 * on standard desktop displays.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="ml-64 min-h-screen">
        <div className="mx-auto max-w-[1600px] px-8 py-8">{children}</div>
      </main>
    </div>
  );
}
