import type { ItemDef, Slot, Zone } from "./types";

interface MakeOpts {
  zone?: Zone;
}

const make = (
  slot: Slot,
  n: number,
  label: string,
  opts: MakeOpts = {},
): ItemDef => {
  const id = `${slot}-${String(n).padStart(2, "0")}`;
  return {
    id,
    slot,
    src: `/dressup/${slot}/${slot}-${String(n).padStart(2, "0")}.png`,
    thumb: `/dressup/${slot}/thumb-${String(n).padStart(2, "0")}.png`,
    label,
    zone: opts.zone,
  };
};

// Full catalog. Per-item `zone` values come from real Alignment Mode tuning
// against the shipped sprites — these become the universal default for every
// user (localStorage overrides still win when present).
export const CATALOG: Record<Slot, ItemDef[]> = {
  headwear: [
    make("headwear", 1, "Bere", {
      zone: { x: 0.36, y: 0, w: 0.26, h: 0.2 },
    }),
    make("headwear", 2, "Papatya Tacı", {
      zone: { x: 0.36, y: 0, w: 0.28, h: 0.2 },
    }),
    make("headwear", 3, "Plaj Şapkası", {
      zone: { x: 0.3, y: 0, w: 0.4, h: 0.22 },
    }),
    make("headwear", 4, "Kurdele", {
      zone: { x: 0.355, y: 0, w: 0.28, h: 0.2 },
    }),
  ],
  glasses: [
    make("glasses", 1, "Yuvarlak Gözlük"),
    make("glasses", 2, "Güneş Gözlüğü"),
    make("glasses", 3, "Kalp Çerçeve"),
    make("glasses", 4, "Kedi Göz"),
  ],
  top: [
    // Long princess dress — extends from upper chest to thigh.
    make("top", 1, "Pamuk Prenses", {
      zone: { x: 0.275, y: 0.135, w: 0.445, h: 0.53 },
    }),
    // Wide flowery dress — taller and wider than default.
    make("top", 2, "Çiçekli Elbise", {
      zone: { x: 0.2, y: 0.21, w: 0.6, h: 0.625 },
    }),
    make("top", 3, "Rock Üstü"),
    make("top", 4, "Çizgili Gömlek"),
  ],
  bottom: [
    make("bottom", 1, "Tayt"),
    make("bottom", 2, "Etek"),
    make("bottom", 3, "Kot Pantolon"),
    make("bottom", 4, "Pantolon"),
  ],
  socks: [
    make("socks", 1, "File Çorap"),
    make("socks", 2, "Kalpli Çorap"),
    make("socks", 3, "Siyah Çorap"),
    make("socks", 4, "Peluş Çorap"),
  ],
  shoes: [
    make("shoes", 1, "Spor Ayakkabı"),
    make("shoes", 2, "Babet"),
    make("shoes", 3, "Çizme"),
    make("shoes", 4, "Bot"),
  ],
};

// Turkish category labels (for tab UI).
export const SLOT_LABEL: Record<Slot, string> = {
  headwear: "Şapka",
  glasses: "Gözlük",
  top: "Üst",
  bottom: "Alt",
  socks: "Çorap",
  shoes: "Ayakkabı",
};

// Always-on base layers. Front hair is split so each piece can be aligned independently.
export const BASE_LAYERS = {
  hairBack: "/dressup/base/hair-back.png",
  body: "/dressup/base/body.png",
  hairFront1: "/dressup/base/hair-front1.png",
  hairFront2: "/dressup/base/hair-front2.png",
} as const;
