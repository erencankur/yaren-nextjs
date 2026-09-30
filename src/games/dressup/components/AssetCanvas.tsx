"use client";

import { useEffect, useRef, useState } from "react";
import type { AssetSettings, EditorAsset } from "../editor";
import type { Zone } from "../types";
import SpriteLayers from "./SpriteLayers";

type Props = {
  visible: EditorAsset[];
  settings: Record<string, AssetSettings>;
  selectedId: string;
  onSelect: (id: string) => void;
  onZoneChange: (id: string, zone: Zone) => void;
};

export default function AssetCanvas({ visible, settings, selectedId, onSelect, onZoneChange }: Props) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 256, h: 384 });
  const gesture = useRef<{ id: string; mode: "move" | "resize"; x: number; y: number; zone: Zone } | null>(null);

  useEffect(() => {
    const element = canvasRef.current;
    if (!element) return;
    const observer = new ResizeObserver(() => setSize({ w: element.clientWidth, h: element.clientHeight }));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = gesture.current;
    if (!drag) return;
    const dx = (event.clientX - drag.x) / size.w;
    const dy = (event.clientY - drag.y) / size.h;
    const z = drag.zone;
    if (drag.mode === "move") onZoneChange(drag.id, { ...z, x: Math.max(-1, Math.min(2, z.x + dx)), y: Math.max(-1, Math.min(2, z.y + dy)) });
    else onZoneChange(drag.id, { ...z, w: Math.max(.01, Math.min(2, z.w + dx)), h: Math.max(.01, Math.min(2, z.h + dy)) });
  };

  return <div ref={canvasRef} className="dressup-canvas relative mx-auto aspect-[2/3] h-full max-h-[min(57dvh,600px)] overflow-hidden rounded-[28px]" onPointerMove={onPointerMove} onPointerUp={() => { gesture.current = null; }} onPointerCancel={() => { gesture.current = null; }}>
    <div className="dressup-canvas-grid absolute inset-0 pointer-events-none" aria-hidden />
    <SpriteLayers visible={visible} settings={settings} size={size} />
    {visible.filter((asset) => asset.id === selectedId).map((asset) => {
      const zone = settings[asset.id].zone;
      return <div key={asset.id} className="dressup-selection absolute z-[1001] touch-none cursor-move" style={{ left: zone.x * size.w, top: zone.y * size.h, width: zone.w * size.w, height: zone.h * size.h }} onPointerDown={(event) => {
        event.preventDefault();
        onSelect(asset.id);
        gesture.current = { id: asset.id, mode: "move", x: event.clientX, y: event.clientY, zone: { ...zone } };
        canvasRef.current?.setPointerCapture(event.pointerId);
      }}>
        <span className="dressup-selection-label">{asset.label}</span>
        <button type="button" aria-label={`${asset.label} boyutunu değiştir`} className="dressup-resize" onPointerDown={(event) => {
          event.stopPropagation();
          event.preventDefault();
          gesture.current = { id: asset.id, mode: "resize", x: event.clientX, y: event.clientY, zone: { ...zone } };
          canvasRef.current?.setPointerCapture(event.pointerId);
        }} />
      </div>;
    })}
  </div>;
}
