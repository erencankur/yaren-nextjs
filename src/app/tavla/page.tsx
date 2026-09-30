import BackgammonBoard from "../../games/backgammon/components/Board";

export const metadata = { title: "Tavla — İki Kişilik" };

export default function TavlaPage() {
  return (
    <main className="min-h-[100dvh] bg-black">
      <BackgammonBoard />
    </main>
  );
}
