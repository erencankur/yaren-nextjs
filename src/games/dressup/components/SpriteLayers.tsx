"use client";

import { useEffect, useState } from "react";
import { getSpriteBBox, type SpriteBBox } from "../spriteBBox";
import type { EditorAsset, EditorSettings } from "../editor";

export default function SpriteLayers({ visible, settings, size }: {
  visible: EditorAsset[];
  settings: EditorSettings;
  size: { w: number; h: number };
}) {
  const [bboxes, setBboxes] = useState<Record<string, SpriteBBox>>({});

  useEffect(() => {
    let active = true;
    visible.forEach((asset) => {
      if (bboxes[asset.src]) return;
      void getSpriteBBox(asset.src).then((box) => {
        if (active && box) setBboxes((current) => current[asset.src] ? current : { ...current, [asset.src]: box });
      });
    });
    return () => { active = false; };
  }, [visible, bboxes]);

  return <>{[...visible].sort((a, b) => settings[a.id].z - settings[b.id].z).map((asset) => {
    const zone = settings[asset.id].zone;
    const bbox = bboxes[asset.src];
    if (!bbox?.w || !bbox?.h) return null;
    const boxW = zone.w * size.w;
    const boxH = zone.h * size.h;
    const scale = Math.min(boxW / bbox.w, boxH / bbox.h);
    const paintedW = bbox.w * scale;
    const paintedH = bbox.h * scale;
    return <div key={asset.id} className="absolute pointer-events-none" style={{ left: zone.x * size.w, top: zone.y * size.h, width: boxW, height: boxH, zIndex: settings[asset.id].z }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={asset.src} alt="" draggable={false} className="absolute max-w-none select-none" style={{ left: (boxW - paintedW) / 2 - bbox.x * scale, top: (boxH - paintedH) / 2 - bbox.y * scale, width: bbox.nw * scale, height: bbox.nh * scale, imageRendering: "pixelated" }} />
    </div>;
  })}</>;
}
