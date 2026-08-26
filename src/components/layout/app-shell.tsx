import { Sidebar } from "./sidebar";
import { MobileNav } from "./mobile-nav";
import { Header } from "./header";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header />
        <main className="flex-1 pb-16 md:pb-0">{children}</main>
        <MobileNav />
      </div>
    </div>
  );
}
