import Link from "next/link";
import HomeMusicPlayer from "./HomeMusicPlayer";

export default function GameHeaderControls({ themed = false }: { themed?: boolean }) {
  return <nav className="game-header-controls" aria-label="Oyun üst menüsü">
    <div className="game-header-music"><HomeMusicPlayer compact={!themed} editor={themed} /></div>
    <GameHomeLink />
  </nav>;
}

export function GameHomeLink({ className = "" }: { className?: string }) {
  return <Link href="/" className={`game-home-link ${className}`} aria-label="Ana sayfaya dön" title="Ana sayfa">
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m3 10 9-7 9 7" /><path d="M5 9.5V20h14V9.5" /><path d="M10 20v-6h4v6" />
    </svg>
  </Link>;
}
