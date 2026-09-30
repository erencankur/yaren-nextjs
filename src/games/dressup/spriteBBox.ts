"use client";

/**
 * Computes the alpha bounding-box of a transparent PNG so we can ignore the
 * empty padding around the artwork. Without this every sprite is treated as
 * occupying its full canvas — a tiny beanie inside a 542x542 transparent
 * square ends up rendered the size of the whole head zone.
 */

export interface SpriteBBox {
  /** bbox in source-image pixels */
  x: number;
  y: number;
  w: number;
  h: number;
  /** native image dimensions */
  nw: number;
  nh: number;
}

const cache = new Map<string, Promise<SpriteBBox | null>>();

const ALPHA_THRESHOLD = 8; // alpha values below this count as fully transparent

export function getSpriteBBox(url: string): Promise<SpriteBBox | null> {
  const hit = cache.get(url);
  if (hit) return hit;
  const p = compute(url).catch(() => null);
  cache.set(url, p);
  return p;
}

async function compute(url: string): Promise<SpriteBBox | null> {
  const img = await loadImg(url);
  const nw = img.naturalWidth;
  const nh = img.naturalHeight;
  if (!nw || !nh) return null;

  const canvas = document.createElement("canvas");
  canvas.width = nw;
  canvas.height = nh;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return { x: 0, y: 0, w: nw, h: nh, nw, nh };
  ctx.drawImage(img, 0, 0);

  let data: Uint8ClampedArray;
  try {
    data = ctx.getImageData(0, 0, nw, nh).data;
  } catch {
    // Tainted (cross-origin) — fall back to full sprite.
    return { x: 0, y: 0, w: nw, h: nh, nw, nh };
  }

  let minX = nw;
  let minY = nh;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < nh; y++) {
    const rowBase = y * nw * 4;
    for (let x = 0; x < nw; x++) {
      const a = data[rowBase + x * 4 + 3];
      if (a > ALPHA_THRESHOLD) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) {
    // Fully transparent — return zero-area bbox; caller can skip render.
    return { x: 0, y: 0, w: 0, h: 0, nw, nh };
  }
  return {
    x: minX,
    y: minY,
    w: maxX - minX + 1,
    h: maxY - minY + 1,
    nw,
    nh,
  };
}

function loadImg(url: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const i = new window.Image();
    i.crossOrigin = "anonymous";
    i.onload = () => res(i);
    i.onerror = rej;
    i.src = url;
  });
}
