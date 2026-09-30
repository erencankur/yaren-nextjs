"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { defaults, EDITOR_ASSETS, EDITOR_STORAGE_KEY, loadSettings, sanitizeSettings, type AssetSettings, type EditorSettings } from "../editor";
import { DRESSUP_THEMES, type DressupTheme } from "../theme";
import type { Zone } from "../types";
import AssetCanvas from "./AssetCanvas";
import DressupHeader from "./DressupHeader";

const GROUPS = ["Tümü", "Karakter", "Şapka", "Gözlük", "Üst", "Alt", "Çorap", "Ayakkabı"];
const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

export default function DressupGame() {
  const [theme, setTheme] = useState<DressupTheme>("dark-purple");
  const [ready, setReady] = useState(false);
  const [settings, setSettings] = useState<EditorSettings>(defaults);
  const [selectedId, setSelectedId] = useState("base:body");
  const [filter, setFilter] = useState("Tümü");
  const [notice, setNotice] = useState("");
  const [savedAt, setSavedAt] = useState("");
  const importRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem("yaren-theme");
    if (DRESSUP_THEMES.some((choice) => choice.id === saved)) setTheme(saved as DressupTheme);
    setSettings(loadSettings());
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem(EDITOR_STORAGE_KEY, JSON.stringify(settings)); setSavedAt(new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })); }
    catch { setNotice("Tarayıcıda kayıt yapılamadı. JSON yedeği indir."); }
  }, [settings, ready]);

  const asset = EDITOR_ASSETS.find((item) => item.id === selectedId) ?? EDITOR_ASSETS[0];
  const selected = settings[asset.id];
  const visible = useMemo(() => EDITOR_ASSETS.filter((item) => settings[item.id].active), [settings]);
  const doneCount = EDITOR_ASSETS.filter((item) => settings[item.id].done).length;
  const selectAsset = (id: string) => setSelectedId(id);
  const update = (id: string, patch: Partial<AssetSettings>) => setSettings((current) => ({
    ...current, [id]: { ...current[id], ...patch, done: patch.done ?? (patch.zone || patch.z !== undefined ? false : current[id].done) },
  }));
  const changeValue = (key: keyof Zone, value: number) => {
    if (!Number.isFinite(value)) return;
    update(asset.id, { zone: { ...selected.zone, [key]: clamp(value / 100, key === "w" || key === "h" ? .01 : -1, 2) } });
  };
  const moveLayer = (direction: -1 | 1) => {
    const nearby = visible.map((item) => settings[item.id].z).filter((z) => direction === 1 ? z > selected.z : z < selected.z);
    const neighbor = direction === 1 ? Math.min(...nearby) : Math.max(...nearby);
    update(asset.id, { z: clamp(Number.isFinite(neighbor) ? neighbor + direction : selected.z + direction, 0, 999) });
  };
  const chooseTheme = (id: DressupTheme) => { setTheme(id); localStorage.setItem("yaren-theme", id); };
  const exportJson = () => {
    const blob = new Blob([JSON.stringify({ version: 1, assets: settings }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "yaren-giydirmece-asset-ayarlari.json";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const importJson = async (file?: File) => {
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      if (parsed?.version !== 1 || !parsed?.assets || typeof parsed.assets !== "object") throw new Error();
      setSettings(sanitizeSettings(parsed.assets));
      setNotice("Ayarlar yüklendi ve kaydedildi.");
    } catch { setNotice("Dosya okunamadı. Düzenleyiciden alınmış JSON yedeğini seç."); }
    if (importRef.current) importRef.current.value = "";
  };

  return <main className={`home-page dressup-editor min-h-[100dvh] ${ready ? "theme-ready" : ""}`} data-theme={theme}>
    <DressupHeader title="Giydirmece · Asset düzenleyici" eyebrow="YAREN İÇİN ÖZEL" theme={theme} onThemeChange={chooseTheme} action={<Link href="/giydirmece" className="dressup-mode-link">← Oyuna dön</Link>} />
    <div className="mx-auto max-w-[1700px] px-4 pb-8 pt-3 sm:px-7">
      <div className="dressup-editor-grid grid gap-4">
        <section className="dressup-panel dressup-library rounded-3xl p-4 sm:p-5" aria-label="Asset listesi">
          <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-bold">Assetler</h2><span className="text-xs text-[var(--home-muted)]">{doneCount}/{EDITOR_ASSETS.length} düzenlendi</span></div>
          <div className="dressup-filters mb-3 flex gap-1.5 overflow-x-auto pb-1">{GROUPS.map((group) => <button key={group} type="button" aria-pressed={filter === group} onClick={() => setFilter(group)} className="dressup-filter shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold">{group}</button>)}</div>
          <div className="dressup-asset-list space-y-1.5 overflow-y-auto pr-1">{EDITOR_ASSETS.filter((item) => filter === "Tümü" || item.group === filter).map((item) => <div key={item.id} className="dressup-asset flex items-center gap-1 rounded-2xl p-1" data-selected={selectedId === item.id}>
            <button type="button" onClick={() => selectAsset(item.id)} aria-pressed={selectedId === item.id} className="flex min-w-0 flex-1 items-center gap-2 rounded-xl p-1 text-left">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.thumb} alt="" loading="lazy" className="h-11 w-11 shrink-0 object-contain [image-rendering:pixelated]" />
              <span className="min-w-0 flex-1"><strong className="block truncate text-sm">{item.label}</strong><span className="text-[11px] text-[var(--home-muted)]">{item.group}</span><span className={`dressup-asset-status mt-1 block w-fit ${settings[item.id].done ? "is-done" : ""}`}>{settings[item.id].done ? "Düzenlendi" : "Düzenlenmeli"}</span></span>
            </button>
            <button type="button" className="dressup-visibility" aria-label={`${item.label} ${settings[item.id].active ? "gizle" : "göster"}`} aria-pressed={settings[item.id].active} title={settings[item.id].active ? "Gizle" : "Göster"} onClick={() => update(item.id, { active: !settings[item.id].active })}>{settings[item.id].active ? "◉" : "○"}</button>
          </div>)}</div>
        </section>
        <section className="dressup-panel dressup-preview rounded-3xl p-4 sm:p-5" aria-label="Karakter önizlemesi">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><div><h2 className="text-lg font-bold">Canlı önizleme</h2><p className="text-xs text-[var(--home-muted)]">Seçili alanı sürükle · köşeden boyutlandır</p></div><span className="dressup-preview-chip rounded-full px-3 py-1 text-xs font-semibold">{asset.label}</span></div>
          <div className="dressup-canvas-wrap flex min-h-[340px] items-center justify-center rounded-[24px] p-3"><AssetCanvas visible={visible} settings={settings} selectedId={selectedId} onSelect={selectAsset} onZoneChange={(id, zone) => update(id, { zone })} /></div>
          {!selected.active && <p className="mt-3 text-center text-xs text-[var(--home-muted)]">Bu parça gizli. Konumunu görmek için listeden veya ayarlardan aç.</p>}
        </section>
        <section className="dressup-panel dressup-inspector rounded-3xl p-4 sm:p-5" aria-label="Asset ayarları">
          <p className="dressup-kicker">Seçili asset</p><h2 className="mt-1 text-xl font-bold">{asset.label}</h2><p className="mt-1 text-xs text-[var(--home-muted)]">{asset.group} · {asset.id}</p>
          <div className={`dressup-status mt-4 rounded-xl px-3 py-2 text-sm font-semibold ${selected.done ? "is-done" : ""}`}>{selected.done ? "✓ Düzenlendi" : "○ Düzenlenmeli"}</div>
          <button type="button" className="dressup-visibility-control mt-4 flex w-full items-center justify-between rounded-xl px-3 py-3 text-sm font-semibold" aria-pressed={selected.active} onClick={() => update(asset.id, { active: !selected.active })}><span>Önizlemede göster</span><span className={`dressup-switch ${selected.active ? "is-on" : ""}`} aria-hidden="true" /></button>
          <div className="mt-5 grid grid-cols-2 gap-3">{([["x", "Yatay konum"], ["y", "Dikey konum"], ["w", "Genişlik"], ["h", "Yükseklik"]] as const).map(([key, label]) => <label key={key} className="dressup-field"><span>{label}</span><div className="flex items-center gap-1"><input type="number" step="1" value={Math.round(selected.zone[key] * 100)} onChange={(event) => changeValue(key, Number(event.target.value))} /><small>%</small></div></label>)}</div>
          <label className="dressup-field mt-4 block"><span>Katman sırası</span><input type="number" min="0" max="999" value={selected.z} onChange={(event) => update(asset.id, { z: clamp(Number(event.target.value) || 0, 0, 999) })} /></label>
          <div className="mt-3 grid grid-cols-2 gap-2"><button type="button" className="dressup-secondary" onClick={() => moveLayer(-1)}>Arkaya al ↓</button><button type="button" className="dressup-secondary" onClick={() => moveLayer(1)}>Öne al ↑</button></div>
          <p className="mt-3 text-xs text-[var(--home-muted)]">Küçük katman sayıları arkada, büyük sayılar önde görünür.</p>
          <button type="button" className="dressup-primary mt-5 w-full" onClick={() => update(asset.id, { done: !selected.done })}>{selected.done ? "Tekrar düzenlenecek olarak işaretle" : "Düzenlendi olarak işaretle"}</button>
          <button type="button" className="dressup-secondary mt-2 w-full" onClick={() => update(asset.id, { ...defaults()[asset.id] })}>Bu asseti sıfırla</button>
          <div className="mt-5 border-t border-[var(--home-border)] pt-5"><h3 className="text-sm font-bold">Yedekleme</h3><p className="mt-1 text-xs text-[var(--home-muted)]">Ayarları başka tarayıcıya taşımak veya ileride oyuna aktarmak için JSON yedeği al.</p><div className="mt-3 grid grid-cols-2 gap-2"><button type="button" className="dressup-secondary" onClick={exportJson}>JSON indir</button><button type="button" className="dressup-secondary" onClick={() => importRef.current?.click()}>JSON yükle</button></div><input ref={importRef} type="file" accept="application/json,.json" className="sr-only" aria-label="Asset ayarları JSON dosyası" onChange={(event) => void importJson(event.target.files?.[0])} /></div>
          {notice && <p role="status" className="mt-3 text-xs font-semibold">{notice}</p>}
        </section>
        <aside className="dressup-panel dressup-notes rounded-3xl p-4 sm:p-5" aria-label="Asset notları ve kayıt özeti">
          <p className="dressup-kicker">Kayıt defteri</p><h2 className="mt-1 text-lg font-bold">Notlar ve ayarlar</h2>
          <p className="mt-1 text-xs text-[var(--home-muted)]">{savedAt ? `Son kayıt: ${savedAt}` : "Kayıt hazırlanıyor"} · {visible.length} parça görünür</p>
          <div className="dressup-note-card mt-4 rounded-2xl p-3">
            <strong className="block text-sm">{asset.label}</strong><span className="text-xs text-[var(--home-muted)]">{selected.active ? "Görünür" : "Gizli"} · {selected.done ? "Düzenlendi" : "Düzenlenmeli"}</span>
            <label className="dressup-field mt-4 block"><span>Bu parça için notun</span><textarea value={selected.note} maxLength={2000} placeholder="Boyut, yerleşim veya sonraki düzenleme için bir not yaz…" onChange={(event) => update(asset.id, { note: event.target.value })} /></label>
            <div className="dressup-note-values mt-3 grid grid-cols-2 gap-2 text-xs"><span>X: {Math.round(selected.zone.x * 100)}%</span><span>Y: {Math.round(selected.zone.y * 100)}%</span><span>Genişlik: {Math.round(selected.zone.w * 100)}%</span><span>Yükseklik: {Math.round(selected.zone.h * 100)}%</span><span>Katman: {selected.z}</span><span>{selected.active ? "Açık" : "Kapalı"}</span></div>
          </div>
          <h3 className="mt-5 text-xs font-bold uppercase tracking-wider text-[var(--home-muted)]">Kaydedilen parçalar</h3>
          <div className="dressup-notes-list mt-2 space-y-2 overflow-y-auto">{EDITOR_ASSETS.map((item) => <button type="button" key={item.id} onClick={() => selectAsset(item.id)} className="dressup-notes-entry w-full rounded-xl p-2 text-left" data-selected={item.id === asset.id}><span className="flex items-center justify-between gap-2"><strong className="truncate text-xs">{item.label}</strong><small>{settings[item.id].active ? "Açık" : "Kapalı"}</small></span><span className="mt-1 block text-[11px] text-[var(--home-muted)]">X {Math.round(settings[item.id].zone.x * 100)}% · Y {Math.round(settings[item.id].zone.y * 100)}% · W {Math.round(settings[item.id].zone.w * 100)}% · H {Math.round(settings[item.id].zone.h * 100)}% · Z {settings[item.id].z}</span>{settings[item.id].note && <span className="mt-1 block break-words text-[11px]">{settings[item.id].note}</span>}</button>)}</div>
        </aside>
      </div>
    </div>
  </main>;
}
