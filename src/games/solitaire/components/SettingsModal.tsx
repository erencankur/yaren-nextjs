"use client";

import { useState } from "react";
import type { DrawMode } from "../engine/constants";
import { audio } from "../audio";
import { useAudio } from "../useAudio";

interface Props {
  drawMode: DrawMode;
  onChangeDrawMode: (m: DrawMode) => void;
  onClose: () => void;
}

export default function SettingsModal(props: Props) {
  const a = useAudio();
  const [view, setView] = useState<"main" | "playlist">("main");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={props.onClose}
    >
      <div
        className="w-full max-w-sm border-4 border-black bg-[#2a3a2e] p-4 text-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        style={{
          boxShadow:
            "inset -3px -3px 0 0 rgba(0,0,0,0.5), inset 3px 3px 0 0 rgba(255,255,255,0.18)",
        }}
      >
        {view === "main" ? (
          <>
            <h2 className="font-pixel text-center text-sm">AYARLAR</h2>

            <div className="mt-5">
              <span className="font-pixel block text-[10px] text-white/80">
                Kart Çekme
              </span>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {([1, 3] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => props.onChangeDrawMode(m)}
                    className={`pixel-btn ${
                      props.drawMode === m ? "pixel-btn-green" : "pixel-btn-slate"
                    }`}
                  >
                    {m === 1 ? "1 Kart" : "3 Kart"}
                  </button>
                ))}
              </div>
              <p className="font-pixel mt-2 text-[8px] leading-4 text-white/60">
                Modu değiştirmek oyunu yeniden başlatır.
              </p>
            </div>

            <div className="mt-5">
              <span className="font-pixel block text-[10px] text-white/80">
                Müzik
              </span>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => audio.toggle()}
                  className={`pixel-btn ${
                    a.isPlaying ? "pixel-btn-orange" : "pixel-btn-blue"
                  }`}
                >
                  {a.isPlaying ? "Duraklat" : "Çal"}
                </button>
                <button
                  type="button"
                  onClick={() => setView("playlist")}
                  className="pixel-btn pixel-btn-blue"
                >
                  Playlist
                </button>
                <button
                  type="button"
                  onClick={() => audio.prev()}
                  className="pixel-btn pixel-btn-slate"
                >
                  ‹‹ Önceki
                </button>
                <button
                  type="button"
                  onClick={() => audio.next()}
                  className="pixel-btn pixel-btn-slate"
                >
                  Sonraki ››
                </button>
              </div>
              <div className="font-pixel mt-2 truncate text-[9px] text-white/70">
                {a.currentTrack ? `♪ ${a.currentTrack.title}` : "Müzik seçilmedi"}
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round(a.musicVolume * 100)}
                onChange={(e) => audio.setMusicVolume(Number(e.target.value) / 100)}
                aria-label="Müzik sesi"
                className="mt-2 w-full accent-orange-400"
              />
            </div>

            <button
              type="button"
              onClick={props.onClose}
              className="pixel-btn pixel-btn-red mt-5 w-full"
            >
              Kapat
            </button>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setView("main")}
                className="pixel-btn pixel-btn-slate"
                aria-label="Geri"
              >
                ‹ Geri
              </button>
              <h2 className="font-pixel text-sm">PLAYLIST</h2>
              <span className="w-12" />
            </div>
            <ul
              className="mt-3 max-h-[60vh] overflow-y-auto border-2 border-black bg-black/35"
              role="listbox"
            >
              {a.tracks.map((t, i) => {
                const isCurrent = i === a.currentIdx;
                return (
                  <li key={t.url}>
                    <button
                      type="button"
                      onClick={() => void audio.play(i)}
                      className={`font-pixel flex w-full items-center gap-2 border-b border-black/40 px-2 py-2 text-left text-[10px] ${
                        isCurrent
                          ? "bg-orange-500/30 text-white"
                          : "text-white/85 hover:bg-white/10"
                      }`}
                      aria-selected={isCurrent}
                      role="option"
                    >
                      <span aria-hidden className="w-4">
                        {isCurrent ? (a.isPlaying ? "▶" : "‖") : ""}
                      </span>
                      <span className="truncate">{t.title}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
