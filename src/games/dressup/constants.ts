import type { BaseLayerKey, Slot, Zone } from "./types";

// Single source of truth for layer stacking (dressup-technical.md §2.1).
//
// Rationale:
//  - hair-front sits between body and garments so long hair tucks UNDER tops
//    & dresses (matches real-life and most stylised avatar games).
//  - glasses are above all clothes/hair but BELOW headwear, so a hat brim
//    can still cover the temples while the lenses remain visible.
//  - headwear stays on top so a hat hides hair, fringe and forehead in one go.
export const Z_INDEX = {
  hairBack: 10,
  body: 20,
  hairFront1: 25,
  hairFront2: 26,
  socks: 30,
  bottom: 40,
  top: 50,
  shoes: 60,
  glasses: 75,
  headwear: 80,
} as const;

// LocalStorage key for per-target zone overrides (alignment mode).
export const ALIGN_STORAGE_KEY = "yaren:dressup:zones:v1";

/**
 * Default zones for the always-on base layers. Tuned with Alignment Mode and
 * baked in here so a fresh user (no localStorage) sees a properly composed
 * character on first load.
 *
 *  - body is shifted down 5% so the feet sit just above the canvas floor and
 *    the head reads at the expected forehead/eye-line.
 *  - hairBack fills the canvas; the two front-hair pieces use separate
 *    top and lower zones so alpha-bbox scaling keeps them aligned.
 */
export const BASE_ZONE: Record<BaseLayerKey, Zone> = {
  hairBack: { x: 0, y: 0, w: 1, h: 1 },
  body: { x: 0, y: 0.05, w: 1, h: 1 },
  hairFront1: { x: 0.19, y: 0, w: 0.62, h: 0.25 },
  hairFront2: { x: 0.065, y: 0.25, w: 0.87, h: 0.75 },
};

/**
 * Default zones per garment slot, expressed as fractions of the 128x192
 * character canvas. Each value is the rectangle that the sprite's *alpha
 * bounding box* should fit inside (using object-contain). Items can supply
 * a more specific override via `ItemDef.zone`; users can override either via
 * Alignment Mode (persisted in localStorage).
 *
 * Anatomical anchors (canvas y-fractions) used to pick these:
 *   forehead/crown ≈ 0.00–0.18, eyes ≈ 0.10–0.14, shoulders ≈ 0.20,
 *   chest 0.25–0.40, waist 0.40–0.50, hips 0.50–0.58, thighs 0.58–0.72,
 *   knees 0.72–0.78, calves 0.78–0.88, feet 0.88–0.98.
 */
export const SLOT_ZONE: Record<Slot, Zone> = {
  // Tight head box; sits across forehead/crown.
  headwear: { x: 0.36, y: 0, w: 0.27, h: 0.2 },
  // Eye line, slightly wider than the head box for temples.
  glasses: { x: 0.34, y: 0.1, w: 0.32, h: 0.07 },
  // Shoulders to upper thigh — covers tees, blouses and short dresses.
  // Long-dress items override this via ItemDef.zone.
  top: { x: 0.275, y: 0.18, w: 0.45, h: 0.4 },
  // Hips through knees — pants, skirts, shorts.
  bottom: { x: 0.3, y: 0.5, w: 0.4, h: 0.32 },
  // Lower calves / ankles.
  socks: { x: 0.36, y: 0.78, w: 0.26, h: 0.12 },
  // Feet area.
  shoes: { x: 0.32, y: 0.86, w: 0.36, h: 0.11 },
};
