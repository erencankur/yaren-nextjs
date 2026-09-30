import { BASE_LAYERS, CATALOG, SLOT_LABEL } from "./catalog";
import { ALIGN_STORAGE_KEY, BASE_ZONE, SLOT_ZONE, Z_INDEX } from "./constants";
import preset from "./preset.json";
import type { Slot, Zone } from "./types";

export const EDITOR_STORAGE_KEY = "yaren:dressup:editor:v1";

export type EditorAsset = {
  id: string;
  label: string;
  group: string;
  src: string;
  thumb: string;
  slot?: Slot;
  defaultZone: Zone;
  defaultZ: number;
};

export type AssetSettings = { zone: Zone; z: number; done: boolean; active: boolean; note: string };
export type EditorSettings = Record<string, AssetSettings>;

export const EDITOR_ASSETS: EditorAsset[] = [
  { id: "base:hairBack", label: "Arka saç", group: "Karakter", src: BASE_LAYERS.hairBack, thumb: BASE_LAYERS.hairBack, defaultZone: BASE_ZONE.hairBack, defaultZ: Z_INDEX.hairBack },
  { id: "base:body", label: "Vücut", group: "Karakter", src: BASE_LAYERS.body, thumb: BASE_LAYERS.body, defaultZone: BASE_ZONE.body, defaultZ: Z_INDEX.body },
  { id: "base:hairFront1", label: "Ön saç · üst", group: "Karakter", src: BASE_LAYERS.hairFront1, thumb: BASE_LAYERS.hairFront1, defaultZone: BASE_ZONE.hairFront1, defaultZ: Z_INDEX.hairFront1 },
  { id: "base:hairFront2", label: "Ön saç · alt", group: "Karakter", src: BASE_LAYERS.hairFront2, thumb: BASE_LAYERS.hairFront2, defaultZone: BASE_ZONE.hairFront2, defaultZ: Z_INDEX.hairFront2 },
  ...Object.entries(CATALOG).flatMap(([slot, items]) => items.map((item) => ({
    id: `item:${item.id}`,
    label: item.label,
    group: SLOT_LABEL[slot as Slot],
    src: item.src,
    thumb: item.thumb,
    slot: slot as Slot,
    defaultZone: item.zone ?? SLOT_ZONE[slot as Slot],
    defaultZ: Z_INDEX[slot as Slot],
  }))),
];

export function defaults(): EditorSettings {
  const saved = preset.assets as Record<string, AssetSettings>;
  return Object.fromEntries(EDITOR_ASSETS.map((asset) => {
    const settings = saved[asset.id];
    return [asset.id, settings ? { ...settings, zone: { ...settings.zone } } : {
      zone: { ...asset.defaultZone }, z: asset.defaultZ, done: false,
      active: asset.id.startsWith("base:"), note: "",
    }];
  }));
}

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));
const splitLegacyHairZone = (zone: Zone, id: string): Zone => {
  const part = id === "base:hairFront1" ? BASE_ZONE.hairFront1 : BASE_ZONE.hairFront2;
  return { x: zone.x + zone.w * part.x, y: zone.y + zone.h * part.y, w: zone.w * part.w, h: zone.h * part.h };
};

export function sanitizeSettings(input: unknown): EditorSettings {
  const source = input && typeof input === "object" ? input as Record<string, unknown> : {};
  const result = defaults();
  for (const asset of EDITOR_ASSETS) {
    const direct = source[asset.id];
    const raw = direct ?? (asset.id.startsWith("base:hairFront") ? source["base:hairFront"] : undefined);
    if (!raw || typeof raw !== "object") continue;
    const data = raw as Record<string, unknown>;
    const zone = data.zone && typeof data.zone === "object"
      ? (direct ? data.zone : splitLegacyHairZone(data.zone as Zone, asset.id)) as Record<string, unknown> : {};
    const fallback = result[asset.id].zone;
    const number = (key: keyof Zone, min: number, max: number) =>
      typeof zone[key] === "number" && Number.isFinite(zone[key]) ? clamp(zone[key], min, max) : fallback[key];
    result[asset.id] = {
      zone: { x: number("x", -1, 2), y: number("y", -1, 2), w: number("w", .01, 2), h: number("h", .01, 2) },
      z: direct && typeof data.z === "number" && Number.isFinite(data.z) ? clamp(Math.round(data.z), 0, 999) : result[asset.id].z,
      done: typeof data.done === "boolean" ? data.done : result[asset.id].done,
      active: typeof data.active === "boolean" ? data.active : result[asset.id].active,
      note: typeof data.note === "string" ? data.note.slice(0, 2000) : result[asset.id].note,
    };
  }
  return result;
}

export function loadSettings(): EditorSettings {
  try {
    const saved = localStorage.getItem(EDITOR_STORAGE_KEY);
    if (saved) return sanitizeSettings(JSON.parse(saved));
    const legacy = localStorage.getItem(ALIGN_STORAGE_KEY);
    if (legacy) {
      const zones = JSON.parse(legacy) as Record<string, Zone>;
      const initial = defaults();
      for (const asset of EDITOR_ASSETS) {
        const zone = zones[asset.id] ?? (asset.id.startsWith("base:hairFront") && zones["base:hairFront"] ? splitLegacyHairZone(zones["base:hairFront"], asset.id) : undefined);
        if (zone) initial[asset.id].zone = zone;
      }
      return sanitizeSettings(initial);
    }
  } catch { /* Invalid local data falls back to defaults. */ }
  return defaults();
}
