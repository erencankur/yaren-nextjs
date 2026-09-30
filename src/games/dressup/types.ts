// Pixel Dress-Up — domain types.
// Slot list covers every garment category currently shipping under
// /public/dressup. Adding a new category means: extend this union, populate
// CATALOG, add SLOT_LABEL/SLOT_ZONE entries, and pick a Z_INDEX.

export type Slot =
  | "headwear"
  | "glasses"
  | "top"
  | "bottom"
  | "socks"
  | "shoes";

export type ItemId = string; // e.g. "headwear-02"

/**
 * Normalized rectangle (0..1) describing where a sprite is painted within
 * the 128x192 character canvas. Sprites use `object-contain`, so the rect's
 * aspect ratio together with the source aspect ratio decides the final size.
 */
export interface Zone {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface ItemDef {
  id: ItemId;
  slot: Slot;
  src: string; // 128x192 PNG path under /public
  thumb: string; // 64x64 thumbnail path
  label: string; // Turkish display name
  /** Optional per-item zone override; falls back to slot default. */
  zone?: Zone;
}

/** Keys used by the always-on base layers. */
export type BaseLayerKey = "hairBack" | "body" | "hairFront1" | "hairFront2";
