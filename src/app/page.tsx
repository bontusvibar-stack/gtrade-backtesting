import { APP_NAME } from "@/config";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="text-3xl font-semibold tracking-tight text-foreground">
        {APP_NAME}
      </h1>
      <p className="max-w-md text-sm text-muted-foreground">
        Modern full-stack trading backtesting platform. Run historical trading
        strategies against market data and analyze performance.
      </p>
      <a
        href="/dashboard"
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        Open Dashboard
      </a>
      <p className="text-xs text-muted-foreground/70">
        Historical backtesting does not guarantee future performance.
      </p>
    </div>
  );
}
