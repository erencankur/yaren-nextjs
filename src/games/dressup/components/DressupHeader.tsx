"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import GameHeaderControls from "../../../components/GameHeaderControls";
import { DRESSUP_THEMES, type DressupTheme } from "../theme";

export default function DressupHeader({ title, eyebrow, theme, onThemeChange, action }: {
  title: string;
  eyebrow: string;
  theme: DressupTheme;
  onThemeChange: (theme: DressupTheme) => void;
  action?: ReactNode;
}) {
  return <header className="dressup-editor-header mx-auto max-w-[1700px] px-4 pt-4 sm:px-7">
    <div className="dressup-hero relative overflow-hidden rounded-[24px]">
      <Image src="/backgrounds/top_background.webp" alt="" fill priority sizes="(max-width: 1700px) 100vw, 1700px" className="pixel-art object-cover" />
      <div className="dressup-hero-shade absolute inset-0" aria-hidden="true" />
      <GameHeaderControls themed />
      <div className="dressup-hero-copy absolute bottom-4 left-5 right-5 text-white sm:bottom-5 sm:left-7"><p className="font-pixel text-[9px] tracking-widest text-white/80">{eyebrow}</p><h1 className="mt-1 text-xl font-bold tracking-tight sm:text-2xl">{title}</h1></div>
    </div>
    <div className="dressup-theme-toolbar flex flex-wrap items-center justify-between gap-3 py-3">
      <div>{action}</div>
      <div className="ml-auto flex items-center gap-3"><span className="text-xs font-semibold text-[var(--home-muted)]">Renk teması</span><div className="flex shrink-0 items-center gap-2 rounded-full border border-[var(--home-border)] bg-[var(--home-panel)] px-3 py-2" role="group" aria-label="Renk teması">
        {DRESSUP_THEMES.map((choice) => <button key={choice.id} type="button" aria-label={`${choice.label} tema`} aria-pressed={theme === choice.id} title={choice.label} onClick={() => onThemeChange(choice.id)} className="theme-dot h-6 w-6 rounded-full border-2 border-white/60 shadow-sm transition-transform hover:scale-110" style={{ background: choice.color }} />)}
      </div></div>
    </div>
  </header>;
}
