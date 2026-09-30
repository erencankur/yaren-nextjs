"use client";

import type { BackgammonColor } from "../types";

const formatTime = (s: number) => {
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
};

export default function WinModal({
  winner,
  playerName,
  elapsedSec,
  onPlayAgain,
}: {
  winner: BackgammonColor;
  playerName: string;
  elapsedSec: number;
  onPlayAgain: () => void;
}) {
  const label = winner === "white" ? "Beyaz" : "Siyah";
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6 backdrop-blur-sm"
    >
      <div className="font-pixel w-full max-w-xs rounded-md border-4 border-black bg-[#3d2412] p-5 text-center text-white shadow-2xl">
        <div className="text-3xl">🏆</div>
        <h2 className="mt-3 text-xl text-amber-200">{playerName} ({label}) kazandı!</h2>
        <p className="mt-3 text-[10px] text-amber-100/80">
          Süre: <span className="tabular-nums">{formatTime(elapsedSec)}</span>
        </p>
        <button
          type="button"
          onClick={onPlayAgain}
          className="pixel-btn pixel-btn-green mt-5 w-full text-[11px]"
        >
          Yeni Oyun
        </button>
      </div>
    </div>
  );
}
