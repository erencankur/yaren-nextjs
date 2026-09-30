"use client";

import Link from "next/link";

interface Props {
  score: number;
  elapsedSec: number;
  onPlayAgain: () => void;
}

export default function WinModal({ onPlayAgain }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-rose-950/60 p-4 backdrop-blur-sm">
      {/* Decorative floating hearts (matches homepage theme) */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <span className="heart-float absolute left-[10%] top-[18%] text-5xl text-rose-300/60">♥</span>
        <span
          className="heart-float absolute right-[12%] top-[22%] text-4xl text-pink-300/60"
          style={{ animationDelay: "1.2s" }}
        >
          ♥
        </span>
        <span
          className="heart-float absolute bottom-[18%] left-[18%] text-3xl text-rose-200/70"
          style={{ animationDelay: "2.1s" }}
        >
          ♥
        </span>
        <span
          className="heart-float absolute bottom-[10%] right-[8%] text-5xl text-pink-200/70"
          style={{ animationDelay: "0.6s" }}
        >
          ♥
        </span>
      </div>

      <div className="relative w-full max-w-sm rounded-3xl border border-rose-200/70 bg-gradient-to-br from-rose-50 via-pink-50 to-amber-50 p-7 text-center shadow-2xl">
        <p className="text-5xl text-rose-500">💖</p>
        <h2
          className="mt-3 text-3xl text-rose-700"
          style={{ fontFamily: "var(--font-script)" }}
        >
          Tebrikler!
        </h2>
        <p className="mt-3 text-sm leading-6 text-rose-900/80">
          hem oyunu hem gönlümü kazandın :)
        </p>

        <div className="mt-7 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onPlayAgain}
            className="rounded-2xl border border-rose-300 bg-white/80 px-4 py-3 text-sm font-semibold text-rose-700 shadow-sm transition hover:-translate-y-0.5 hover:border-rose-500 hover:shadow-md"
          >
            Yeni El
          </button>
          <Link
            href="/"
            className="rounded-2xl border border-rose-400 bg-rose-500 px-4 py-3 text-center text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-rose-600 hover:shadow-md"
          >
            Çıkış
          </Link>
        </div>
      </div>
    </div>
  );
}

