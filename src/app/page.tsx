"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import HomeMusicPlayer from "../components/HomeMusicPlayer";

const GAMES = [
  { href: "/solitaire", title: "Solitaire", kind: "solitaire", category: "KART OYUNU", number: "01", action: "Oyna", available: true },
  { href: "/tavla", title: "Tavla", kind: "tavla", category: "İKİ KİŞİLİK", number: "02", action: "Oyna", available: true },
  { href: "/giydirmece", title: "Giydirmece", kind: "dressup", category: "STİL OYUNU", number: "03", action: "Oyna", available: true },
  { href: "/ates-ve-su", title: "Ateş ve Su", kind: "coming", category: "YAKINDA", number: "04", action: "Yakında", available: false },
] as const;

const THEMES = [
  { id: "dark-purple", label: "Koyu mor", color: "#d8b5f5" },
  { id: "dark-green", label: "Koyu yeşil", color: "#b9ecd4" },
  { id: "light-purple", label: "Açık mor", color: "#4e2769" },
  { id: "light-green", label: "Açık yeşil", color: "#265e49" },
] as const;
type Theme = (typeof THEMES)[number]["id"];

export default function HomePage() {
  const [theme, setTheme] = useState<Theme>("dark-purple");
  const [themeReady, setThemeReady] = useState(false);
  useEffect(() => {
    const saved = window.localStorage.getItem("yaren-theme");
    if (THEMES.some((choice) => choice.id === saved)) setTheme(saved as Theme);
    setThemeReady(true);
  }, []);
  const chooseTheme = (next: Theme) => {
    setTheme(next);
    window.localStorage.setItem("yaren-theme", next);
  };

  return (
    <main className={`home-page relative min-h-[100dvh] overflow-hidden ${themeReady ? "theme-ready" : ""}`} data-theme={theme}>
      <div aria-hidden className="home-glow pointer-events-none absolute inset-0" />
      <div className="home-brand absolute left-5 top-5 z-30 sm:left-8 sm:top-7" aria-label="Yaren ve Eren">Y <span>♥</span> E</div>
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        {[
          ["♥", "10%", "15%", "0s", "2.5rem"], ["✦", "26%", "9%", "1.4s", "1.2rem"],
          ["♥", "83%", "18%", "1.2s", "2rem"], ["✧", "70%", "9%", "2.3s", "2rem"],
          ["✦", "7%", "65%", "0.7s", "1.5rem"], ["♥", "19%", "82%", "2.1s", "1.8rem"],
          ["✧", "90%", "67%", "1.7s", "2.2rem"], ["♥", "78%", "87%", "0.6s", "2.5rem"],
        ].map(([symbol, left, top, delay, size], i) => (
          <span key={i} className="heart-float home-spark absolute" style={{ left, top, animationDelay: delay, fontSize: size }}>{symbol}</span>
        ))}
      </div>

      <div className="absolute right-4 top-4 z-30 flex items-center gap-2 rounded-full border border-[var(--home-border)] bg-[var(--home-panel)] px-3 py-2 shadow-sm backdrop-blur-md sm:right-7 sm:top-6" role="group" aria-label="Renk teması">
        {THEMES.map((choice) => (
          <button key={choice.id} type="button" aria-label={`${choice.label} tema`} aria-pressed={theme === choice.id} title={choice.label} onClick={() => chooseTheme(choice.id)} className="theme-dot h-6 w-6 rounded-full border-2 border-white/60 shadow-sm transition-transform hover:scale-110" style={{ background: choice.color }} />
        ))}
      </div>

      <section className="relative z-10 mx-auto max-w-6xl px-5 pb-12 pt-28 sm:px-8 sm:pt-36">
        <div className="home-hero">
          <div className="home-hero-copy">
            <span className="home-eyebrow inline-flex items-center gap-2 rounded-full px-4 py-2 text-[11px] font-bold uppercase tracking-[0.19em]"><span className="home-live-dot" /> Sadece sana özel</span>
            <h1 className="mt-5 text-balance text-5xl font-semibold leading-[1.08] tracking-[-.055em] sm:text-6xl lg:text-7xl">Hoş geldin, <span className="home-hero-script">Yaren.</span></h1>
            <p className="mt-4 max-w-lg text-base leading-relaxed text-[var(--home-muted)] sm:text-lg">Sana ufak bir oyun köşesi hazırladım çiçeğim. Bir şarkı seç, sonra başlayalım ♡</p>
          </div>
          <div className="home-hero-music"><HomeMusicPlayer /></div>
        </div>
        <div className="home-section-heading mt-12 flex items-end justify-between gap-4 sm:mt-16">
          <div><span className="home-section-kicker">BİZİM KÖŞEMİZ</span><h2 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Bugün ne oynayalım?</h2></div>
          <span className="home-section-count">03 oyun hazır</span>
        </div>
        <ul className="home-games-grid mt-5 grid w-full grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
          {GAMES.map((game) => (
            <li key={game.href}>
              {game.available ? (
                <Link href={game.href} className={`home-game home-game--${game.kind} group relative flex h-full min-h-[198px] flex-col overflow-hidden rounded-[28px] p-5 sm:min-h-[224px] sm:p-6`}>
                  <span className="home-game-top"><span className="home-game-number">{game.number}</span><span className="home-game-category">{game.category}</span></span>
                  <span className="home-game-title">{game.title}</span>
                  <GameArtwork kind={game.kind} />
                  <span className="home-game-action">{game.action}<span className="home-game-arrow" aria-hidden>↗</span></span>
                </Link>
              ) : (
                <div className={`home-game home-game--${game.kind} relative flex h-full min-h-[198px] flex-col overflow-hidden rounded-[28px] p-5 sm:min-h-[224px] sm:p-6`} aria-disabled="true">
                  <span className="home-game-top"><span className="home-game-number">{game.number}</span><span className="home-game-category">{game.category}</span></span>
                  <span className="home-game-title">{game.title}</span>
                  <GameArtwork kind={game.kind} />
                  <span className="home-game-action">{game.action}<span className="home-game-arrow" aria-hidden>✦</span></span>
                </div>
              )}
            </li>
          ))}
        </ul>
        <footer className="mt-10 text-center text-xs font-medium tracking-[.12em] text-[var(--home-muted)]">YAREN & EREN · SEVGİYLE HAZIRLANDI</footer>
      </section>
    </main>
  );
}

function GameArtwork({ kind }: { kind: (typeof GAMES)[number]["kind"] }) {
  if (kind === "solitaire") return <span className="home-art home-art--cards" aria-hidden>
    <Image className="home-art-card home-art-card--one" src="/cards/hearts/hearts_card_12.png" alt="" width={78} height={112} />
    <Image className="home-art-card home-art-card--two" src="/cards/spades/spades_card_11.png" alt="" width={78} height={112} />
    <Image className="home-art-card home-art-card--three" src="/cards/back.png" alt="" width={78} height={112} />
  </span>;
  if (kind === "tavla") return <span className="home-art home-art--tavla" aria-hidden><svg viewBox="0 0 210 140" fill="none">
    <rect x="3" y="3" width="204" height="134" rx="18" fill="currentColor" fillOpacity=".09" stroke="currentColor" strokeOpacity=".32" strokeWidth="3" />
    <path d="M19 20h26L32 94 19 20Zm30 0h26L62 94 49 20Zm30 0h26L92 94 79 20Zm30 0h26l-13 74-13-74Zm30 0h26l-13 74-13-74Zm30 0h26l-13 74-13-74Z" fill="currentColor" fillOpacity=".32" />
    <path d="M19 120h26L32 47l-13 73Zm60 0h26L92 47l-13 73Zm60 0h26l-13-73-13 73Z" fill="currentColor" fillOpacity=".17" />
    <circle cx="32" cy="31" r="10" fill="#fffaf3" stroke="currentColor" strokeOpacity=".4" strokeWidth="2" /><circle cx="32" cy="53" r="10" fill="#fffaf3" stroke="currentColor" strokeOpacity=".4" strokeWidth="2" />
    <circle cx="153" cy="109" r="10" fill="currentColor" /><circle cx="153" cy="87" r="10" fill="currentColor" />
    <rect x="88" y="51" width="34" height="34" rx="8" fill="#fffaf3" stroke="currentColor" strokeOpacity=".3" strokeWidth="2" transform="rotate(-12 105 68)" />
    <circle cx="98" cy="59" r="2.7" fill="currentColor" /><circle cx="106" cy="68" r="2.7" fill="currentColor" /><circle cx="114" cy="77" r="2.7" fill="currentColor" />
  </svg></span>;
  if (kind === "dressup") return <span className="home-art home-art--dressup" aria-hidden>
    <span className="home-art-halo" />
    <Image className="home-art-dress home-art-dress--one" src="/dressup/top/thumb-02.png" alt="" width={94} height={94} />
    <Image className="home-art-dress home-art-dress--two" src="/dressup/headwear/thumb-02.png" alt="" width={68} height={68} />
    <Image className="home-art-dress home-art-dress--three" src="/dressup/shoes/thumb-02.png" alt="" width={72} height={72} />
    <span className="home-art-spark home-art-spark--one">✦</span><span className="home-art-spark home-art-spark--two">✧</span>
  </span>;
  return <span className="home-art home-art--coming" aria-hidden><svg viewBox="0 0 180 140" fill="none">
    <path d="M58 115c-21-14-24-38-7-57 3 13 12 17 16 19C61 51 73 32 86 17c-2 26 26 30 23 58-2 23-20 43-42 43-3 0-6-1-9-3Z" fill="currentColor" fillOpacity=".45" />
    <path d="M111 100c0-19 18-37 31-54 1 18 19 35 19 54 0 15-11 26-25 26s-25-11-25-26Z" fill="currentColor" fillOpacity=".23" />
  </svg></span>;
}
