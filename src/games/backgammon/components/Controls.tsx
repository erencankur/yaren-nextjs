"use client";

import Link from "next/link";

interface Props {
  canUndo: boolean;
  /** Label for the central roll button (phase-aware). */
  rollLabel: string;
  /** When true the central button is greyed out (e.g. moving phase). */
  rollDisabled: boolean;
  onRoll: () => void;
  onUndo: () => void;
  onNewGame: () => void;
  onSettings: () => void;
}

export default function Controls(props: Props) {
  return (
    <footer
      className="grid grid-cols-5 gap-1.5 border-t-4 border-black bg-[#3d2412] p-2"
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
      <button
        type="button"
        onClick={props.onRoll}
        disabled={props.rollDisabled}
        className="pixel-btn pixel-btn-green"
        aria-label="Zar At"
      >
        {props.rollLabel}
      </button>
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
