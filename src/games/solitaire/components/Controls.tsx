"use client";

import Link from "next/link";

interface Props {
  score: number;
  canUndo: boolean;
  onUndo: () => void;
  onNewGame: () => void;
  onSettings: () => void;
}

export default function Controls(props: Props) {
  return (
    <footer
      className="grid shrink-0 grid-cols-5 gap-1.5 border-t-4 border-black bg-[#3d2412] p-2"
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 8px)" }}
    >
      <button
        type="button"
        onClick={props.onUndo}
        disabled={!props.canUndo}
        className="pixel-btn pixel-btn-orange"
      >
        Geri Al
      </button>
      <button
        type="button"
        onClick={props.onNewGame}
        className="pixel-btn pixel-btn-blue"
      >
        Yeni El
      </button>
      {/* Score chip — non-interactive, styled like a button */}
      <div className="pixel-btn pixel-btn-brown text-center" aria-label="Skor">
        {props.score}
      </div>
      <button
        type="button"
        onClick={props.onSettings}
        className="pixel-btn pixel-btn-slate"
      >
        Ayarlar
      </button>
      <Link
        href="/"
        className="pixel-btn pixel-btn-red flex items-center justify-center text-center"
      >
        Çıkış
      </Link>
    </footer>
  );
}
