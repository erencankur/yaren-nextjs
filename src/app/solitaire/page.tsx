import SolitaireClient from "@/games/solitaire/components/SolitaireClient";

export const metadata = { title: "Two of Hearts — Solitaire" };

export default function SolitairePage() {
  return (
    <main className="min-h-[100dvh] bg-black">
      <SolitaireClient />
    </main>
  );
}
