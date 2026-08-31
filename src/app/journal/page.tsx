import { TradeJournal } from "@/components/journal/TradeJournal";

export default function JournalPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <h1 className="text-sm font-bold tracking-widest text-white">TRADE JOURNAL</h1>
      <p className="text-xs text-white/40">Log · Calendar · Analytics · Reviews</p>
      <div className="mt-6">
        <TradeJournal />
      </div>
    </div>
  );
}
