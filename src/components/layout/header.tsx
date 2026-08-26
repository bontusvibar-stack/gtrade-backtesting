import Link from "next/link";
import { APP_NAME } from "@/config";
import { LogoutButton } from "@/components/auth/logout-button";

export function Header() {
  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-card px-4">
      <Link href="/dashboard" className="text-sm font-semibold tracking-tight">
        {APP_NAME}
      </Link>
      <nav className="flex items-center gap-4 text-sm text-muted-foreground">
        <Link href="/settings" className="hover:text-foreground">
          Settings
        </Link>
        <LogoutButton />
      </nav>
    </header>
  );
}
