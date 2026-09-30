"use client";

import { useEffect, useReducer, useRef, useState } from "react";
import { audio } from "../games/solitaire/audio";
import { TRACKS } from "../games/solitaire/musicTracks";

export default function HomeMusicPlayer({ compact = false, editor = false }: { compact?: boolean; editor?: boolean }) {
  const [, rerender] = useReducer((x: number) => x + 1, 0);
  const [showPlaylist, setShowPlaylist] = useState(false);
  const openButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsub = audio.subscribe(rerender);
    const idx = TRACKS.findIndex((track) => track.title === "Bir Derdim Var");
    void audio.ensurePlaying(idx >= 0 ? idx : 0);
    const onGesture = (event: PointerEvent) => {
      if ((event.target as Element).closest("[data-music-control]")) return;
      audio.unlock();
      window.removeEventListener("pointerdown", onGesture, true);
    };
    window.addEventListener("pointerdown", onGesture, true);
    return () => {
      unsub();
      window.removeEventListener("pointerdown", onGesture, true);
    };
  }, []);

  useEffect(() => {
    if (!showPlaylist) return;
    const previousOverflow = document.body.style.overflow;
    const trigger = openButtonRef.current;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setShowPlaylist(false);
      if (event.key === "Tab") {
        const buttons = Array.from(dialogRef.current?.querySelectorAll<HTMLButtonElement>("button:not([disabled])") ?? []);
        const first = buttons[0];
        const last = buttons[buttons.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      trigger?.focus();
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [showPlaylist]);

  const current = audio.currentTrack;
  const isPlaying = audio.isPlaying;
  const togglePlayback = () => audio.toggle();

  return (
    <>
      {compact || editor ? <div data-music-control className={`compact-music ${editor ? "editor-music" : "game-music"}`}>
        <span className="compact-music-art" aria-hidden><i /><i /><i /></span>
        <span className="compact-music-copy"><span className="compact-music-eyebrow">{isPlaying ? "Şimdi çalıyor" : "Duraklatıldı"}</span><span className="compact-music-title">{current?.title ?? "Bir şarkı seç"}</span></span>
        <button type="button" onClick={togglePlayback} aria-label={isPlaying ? "Şarkıyı durdur" : "Şarkıyı oynat"} className="compact-music-button" title={isPlaying ? "Durdur" : "Oynat"}>{isPlaying ? <PauseIcon /> : <PlayIcon />}</button>
        <button ref={openButtonRef} type="button" onClick={() => setShowPlaylist(true)} aria-label="Playlist'i aç" aria-haspopup="dialog" className="compact-music-button" title="Playlist'i aç"><ListIcon /></button>
      </div> : <div data-music-control className="home-playlist mt-7 flex w-full max-w-[400px] items-center gap-3 rounded-2xl p-3 text-left sm:p-3.5">
        <span className="playlist-cover flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white" aria-hidden><span className="playlist-record" /></span>
        <div className="min-w-0 flex-1">
          <span className="block text-[10px] font-semibold uppercase tracking-[.16em] text-[var(--home-muted)]">{isPlaying ? "Şimdi çalıyor" : "Duraklatıldı"}</span>
          <span className="mt-0.5 block truncate text-sm font-semibold">{current?.title ?? "Bir şarkı seç"}</span>
        </div>
        <button type="button" onClick={togglePlayback} aria-label={isPlaying ? "Şarkıyı durdur" : "Şarkıyı oynat"} className="playlist-icon-button" title={isPlaying ? "Durdur" : "Oynat"}>
          {isPlaying ? <PauseIcon /> : <PlayIcon />}
        </button>
        <button ref={openButtonRef} type="button" onClick={() => setShowPlaylist(true)} aria-label="Playlist'i aç" aria-haspopup="dialog" className="playlist-icon-button" title="Playlist'i aç">
          <ListIcon />
        </button>
      </div>}

      {showPlaylist && (
        <div data-music-control className={`playlist-overlay ${compact ? "game-playlist-scope" : ""} fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-5`} onClick={(event) => {
          if (event.target === event.currentTarget) setShowPlaylist(false);
        }}>
          <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="playlist-title" className="playlist-modal flex w-full max-w-lg flex-col overflow-hidden rounded-t-[28px] shadow-2xl sm:rounded-[28px]">
            <div className="playlist-handle mx-auto mt-3 h-1 w-11 shrink-0 rounded-full sm:hidden" aria-hidden />
            <header className="flex items-start justify-between gap-4 px-5 pb-5 pt-5 sm:px-7 sm:pt-7">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-[.18em] text-[var(--home-muted)]">Bizim şarkılarımız</span>
                <h2 id="playlist-title" className="mt-1 text-2xl font-bold tracking-tight">Playlist</h2>
                <p className="mt-1 text-xs text-[var(--home-muted)]">{TRACKS.length} şarkı · Birlikte dinleyelim</p>
              </div>
              <button ref={closeButtonRef} type="button" onClick={() => setShowPlaylist(false)} aria-label="Playlist'i kapat" className="playlist-close flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xl leading-none">×</button>
            </header>

            <div className="playlist-feature mx-5 mb-5 flex items-center gap-3 rounded-2xl p-3 sm:mx-7">
              <span className="playlist-cover flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white" aria-hidden><span className="playlist-record" /></span>
              <div className="min-w-0 flex-1">
                <span className="block text-[10px] font-bold uppercase tracking-[.16em] text-[var(--home-muted)]">{isPlaying ? "Şimdi çalıyor" : "Duraklatıldı"}</span>
                <span className="mt-0.5 block truncate text-sm font-semibold">{current?.title ?? "Bir şarkı seç"}</span>
              </div>
              <button type="button" onClick={togglePlayback} aria-label={isPlaying ? "Şarkıyı durdur" : "Şarkıyı oynat"} className="playlist-icon-button" title={isPlaying ? "Durdur" : "Oynat"}>
                {isPlaying ? <PauseIcon /> : <PlayIcon />}
              </button>
            </div>

            <div className="playlist-list-header flex items-center justify-between border-t px-5 py-3 text-[11px] font-bold uppercase tracking-[.14em] text-[var(--home-muted)] sm:px-7">
              <span>Şarkılar</span><span>{TRACKS.length} parça</span>
            </div>
            <ul className="playlist-track-list max-h-[min(54dvh,420px)] overflow-y-auto px-3 pb-[max(16px,env(safe-area-inset-bottom))] sm:px-5">
              {TRACKS.map((track, index) => {
                const active = audio.currentIdx === index;
                return (
                  <li key={track.url}>
                    <button type="button" aria-current={active ? "true" : undefined} onClick={() => {
                      void audio.play(index);
                    }} className={`playlist-track my-0.5 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors ${active ? "is-active" : ""}`}>
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-semibold">{active && isPlaying ? <span className="playlist-playing-bars" aria-label="Çalıyor"><i /><i /><i /></span> : String(index + 1).padStart(2, "0")}</span>
                      <span className="min-w-0 flex-1 truncate text-sm font-medium">{track.title}</span>
                      {active && <span className="text-xs font-semibold">Seçili</span>}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}

function PauseIcon() {
  return <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor" aria-hidden><rect x="5" y="4" width="3" height="12" rx="1" /><rect x="12" y="4" width="3" height="12" rx="1" /></svg>;
}
function PlayIcon() {
  return <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor" aria-hidden><path d="M6 3.8a1 1 0 0 1 1.5-.86l9 6.2a1 1 0 0 1 0 1.72l-9 6.2A1 1 0 0 1 6 16.2V3.8Z" /></svg>;
}
function ListIcon() {
  return <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden><path d="M4 5h12M4 10h12M4 15h12" /></svg>;
}
