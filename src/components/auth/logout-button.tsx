"use client";

export function LogoutButton() {
  return (
    <form action="/logout" method="post">
      <button
        type="submit"
        className="rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
        Logout
      </button>
    </form>
  );
}
