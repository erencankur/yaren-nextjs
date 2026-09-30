"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { CATALOG, SLOT_LABEL } from "../catalog";
import { defaults, EDITOR_ASSETS, type EditorSettings } from "../editor";
import { DRESSUP_THEMES, type DressupTheme } from "../theme";
import type { Slot } from "../types";
import DressupHeader from "./DressupHeader";
import SpriteLayers from "./SpriteLayers";

const SLOTS: Slot[] = ["headwear", "glasses", "top", "bottom", "socks", "shoes"];
const OUTFIT_KEY = "yaren:dressup:outfit:v1";
const HAIR_IDS = new Set(["base:hairBack", "base:hairFront1", "base:hairFront2"]);
// These two pieces were marked in Yaren's saved asset notes as hiding the hair.
const HAIR_HIDING_HATS = new Set(["item:headwear-01", "item:headwear-03"]);
type Outfit = Record<Slot, string | null>;

function startingOutfit(): Outfit {
  const preset = defaults();
  return Object.fromEntries(SLOTS.map((slot) => [slot, EDITOR_ASSETS.find((asset) => asset.slot === slot && preset[asset.id].active)?.id ?? null])) as Outfit;
}

function loadOutfit(): Outfit {
  const initial = startingOutfit();
  try {
    const saved = JSON.parse(localStorage.getItem(OUTFIT_KEY) ?? "null") as Record<string, unknown> | null;
    if (!saved || typeof saved !== "object") return initial;
    for (const slot of SLOTS) {
      const id = saved[slot];
      if (id === null || (typeof id === "string" && EDITOR_ASSETS.some((asset) => asset.id === id && asset.slot === slot))) initial[slot] = id;
    }
  } catch { /* Ignore an invalid saved outfit. */ }
  return initial;
}

function CharacterStage({ visible, settings }: { visible: typeof EDITOR_ASSETS; settings: EditorSettings }) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 340, h: 510 });

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const measure = () => {
      const { width, height } = element.getBoundingClientRect();
      setSize({ w: width, h: height });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return <div className="dressup-play-stage-wrap">
    <div ref={ref} className="dressup-play-stage dressup-canvas-grid relative mx-auto aspect-[2/3]">
      <SpriteLayers visible={visible} settings={settings} size={size} />
    </div>
  </div>;
}

export default function DressupPlay() {
  const [theme, setTheme] = useState<DressupTheme>("dark-purple");
  const [ready, setReady] = useState(false);
  const [started, setStarted] = useState(false);
  const [slot, setSlot] = useState<Slot>("top");
  // Play uses the published layout on every device. Local editor drafts stay in
  // the editor so an older draft cannot override the current asset alignment.
  const [settings] = useState<EditorSettings>(defaults);
  const [outfit, setOutfit] = useState<Outfit>(startingOutfit);

  useEffect(() => {
    const savedTheme = localStorage.getItem("yaren-theme");
    if (DRESSUP_THEMES.some((choice) => choice.id === savedTheme)) setTheme(savedTheme as DressupTheme);
    setOutfit(loadOutfit());
    setReady(true);
  }, []);
  useEffect(() => {
    if (ready) localStorage.setItem(OUTFIT_KEY, JSON.stringify(outfit));
  }, [outfit, ready]);

  const chooseTheme = (choice: DressupTheme) => { setTheme(choice); localStorage.setItem("yaren-theme", choice); };
  const visible = useMemo(() => EDITOR_ASSETS.filter((asset) => {
    if (asset.id.startsWith("base:")) return !(HAIR_HIDING_HATS.has(outfit.headwear ?? "") && HAIR_IDS.has(asset.id));
    return asset.slot ? outfit[asset.slot] === asset.id : false;
  }), [outfit]);
  const worn = SLOTS.filter((part) => outfit[part]).length;
  const activeItem = EDITOR_ASSETS.find((asset) => asset.id === outfit[slot]);

  return <main className={`home-page dressup-play-page min-h-[100dvh] ${ready ? "theme-ready" : ""}`} data-theme={theme}>
    <DressupHeader title={started ? "Giydirmece · Oyna" : "Giydirmece"} eyebrow="YAREN İÇİN ÖZEL" theme={theme} onThemeChange={chooseTheme} action={started ? <Link href="/giydirmece/duzenle" className="dressup-mode-link">Düzenleyici ↗</Link> : null} />
    {!started ? <section className="dressup-mode-chooser mx-auto max-w-6xl px-4 pb-12 pt-8 sm:px-7 sm:pt-12" aria-labelledby="dressup-choice-title">
      <p className="dressup-kicker">BİRLİKTE HAZIRLANALIM</p>
      <h2 id="dressup-choice-title" className="mt-2 text-3xl font-bold tracking-tight sm:text-5xl">Bugün ne yapmak istersin, Yaren?</h2>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--home-muted)] sm:text-base">İstediğin parçaları seçerek kendi görünümünü oluştur. Assetlerin konumunu değiştirmek istersen düzenleyici de burada duruyor.</p>
      <div className="dressup-choice-grid mt-8 grid gap-5 md:grid-cols-2">
        <button type="button" onClick={() => setStarted(true)} className="dressup-choice-card dressup-choice-play group relative min-h-[285px] overflow-hidden rounded-[30px] p-7 text-left sm:p-9">
          <span className="dressup-choice-number">01 / OYUN</span><span className="dressup-choice-icon" aria-hidden>✦</span>
          <span className="mt-12 block text-3xl font-bold tracking-tight sm:text-4xl">Oyna</span>
          <span className="mt-2 block max-w-xs text-sm leading-relaxed text-[var(--home-muted)]">Şapka, gözlük ve kıyafetleri seç. Yaren&apos;in görünümü anında değişsin.</span>
          <span className="dressup-choice-cta mt-6 inline-flex items-center gap-3">Giydirmeye başla <span aria-hidden>↗</span></span>
        </button>
        <Link href="/giydirmece/duzenle" className="dressup-choice-card dressup-choice-edit group relative min-h-[285px] overflow-hidden rounded-[30px] p-7 sm:p-9">
          <span className="dressup-choice-number">02 / ATÖLYE</span><span className="dressup-choice-icon" aria-hidden>✧</span>
          <span className="mt-12 block text-3xl font-bold tracking-tight sm:text-4xl">Düzenle</span>
          <span className="mt-2 block max-w-xs text-sm leading-relaxed text-[var(--home-muted)]">Parçaların konumunu, boyutunu ve katman sırasını ayarla.</span>
          <span className="dressup-choice-cta mt-6 inline-flex items-center gap-3">Düzenleyiciyi aç <span aria-hidden>↗</span></span>
        </Link>
      </div>
    </section> : <div className="dressup-play-layout mx-auto grid max-w-6xl gap-5 px-4 pb-14 pt-4 sm:px-7 lg:grid-cols-[minmax(340px,460px)_minmax(0,1fr)]">
      <section className="dressup-play-panel dressup-play-character rounded-[28px] p-5 sm:p-6" aria-label="Yaren'in görünümü">
        <div className="flex items-start justify-between gap-3"><div><p className="dressup-kicker">CANLI GÖRÜNÜM</p><h2 className="mt-1 text-2xl font-bold">Yaren&apos;in stili</h2></div><span className="dressup-play-count">{worn} / {SLOTS.length} parça</span></div>
        <CharacterStage visible={visible} settings={settings} />
        <div className="dressup-look-actions flex flex-wrap items-center justify-between gap-2"><p className="text-xs text-[var(--home-muted)]">Seçimlerin bu cihazda saklanır ♡</p><button type="button" className="dressup-reset-button" onClick={() => setOutfit(startingOutfit())}>Görünümü sıfırla</button></div>
      </section>
      <section className="dressup-play-panel dressup-play-wardrobe rounded-[28px] p-5 sm:p-6" aria-label="Kıyafet dolabı">
        <p className="dressup-kicker">KIYAFET DOLABI</p><h2 className="mt-1 text-2xl font-bold">Bir parça seçelim</h2><p className="mt-2 text-sm text-[var(--home-muted)]">Her kategoriden bir parça seçebilir, tekrar dokunarak çıkarabilirsin.</p>
        <div className="dressup-play-tabs mt-6 flex gap-2 overflow-x-auto pb-2" role="tablist" aria-label="Kıyafet kategorileri">{SLOTS.map((part) => <button key={part} type="button" role="tab" aria-selected={slot === part} onClick={() => setSlot(part)} className="dressup-play-tab shrink-0 rounded-full px-4 py-2.5 text-sm font-semibold">{SLOT_LABEL[part]}{outfit[part] && <span className="dressup-tab-dot ml-2" aria-label="Seçili parça var" />}</button>)}</div>
        <div className="dressup-play-category mt-5 flex items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-widest text-[var(--home-muted)]">{SLOT_LABEL[slot]}</p><h3 className="mt-1 text-lg font-bold">{activeItem?.label ?? "Henüz seçilmedi"}</h3></div><span className="text-xs text-[var(--home-muted)]">{CATALOG[slot].length} seçenek</span></div>
        <div className="dressup-play-items mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-2">{CATALOG[slot].map((item) => {
          const id = `item:${item.id}`;
          return <button key={item.id} type="button" aria-pressed={outfit[slot] === id} onClick={() => setOutfit((current) => ({ ...current, [slot]: current[slot] === id ? null : id }))} className="dressup-play-item group rounded-2xl p-3 text-left">
            <span className="dressup-play-thumb flex h-28 items-center justify-center rounded-xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.thumb} alt="" loading="lazy" className="max-h-24 max-w-full object-contain [image-rendering:pixelated]" />
            </span>
            <span className="mt-3 flex items-center justify-between gap-2"><strong className="min-w-0 truncate text-sm">{item.label}</strong><span className="dressup-item-check" aria-hidden>{outfit[slot] === id ? "✓" : "+"}</span></span>
          </button>;
        })}</div>
        <button type="button" disabled={!outfit[slot]} onClick={() => setOutfit((current) => ({ ...current, [slot]: null }))} className="dressup-remove-item mt-4 w-full rounded-xl px-4 py-3 text-sm font-semibold">{SLOT_LABEL[slot]} parçasını çıkar</button>
      </section>
    </div>}
  </main>;
}
