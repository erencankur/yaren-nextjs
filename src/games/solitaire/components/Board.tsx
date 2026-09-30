"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import GameHeaderControls from "../../../components/GameHeaderControls";
import { audio } from "../audio";
import type { DrawMode } from "../engine/constants";
import {
  CARD_HEIGHT,
  CARD_WIDTH,
  NUM_TABLEAU_COLUMNS,
  REF_BOARD_HEIGHT,
  REF_BOARD_WIDTH,
  TABLEAU_FACE_DOWN_OFFSET,
  TABLEAU_FACE_UP_OFFSET,
  WASTE_FAN_OFFSET_X,
} from "../engine/constants";
import { useSolitaire } from "../hooks/useSolitaire";
import Controls from "./Controls";
import SettingsModal from "./SettingsModal";
import WinModal from "./WinModal";

const PAD_X = 16;
const TOP_Y = 16;
const TABLEAU_Y = TOP_Y + CARD_HEIGHT + 24;
const COL_GAP =
  (REF_BOARD_WIDTH - 2 * PAD_X - NUM_TABLEAU_COLUMNS * CARD_WIDTH) /
  (NUM_TABLEAU_COLUMNS - 1);

// Effective board height for an initial deal. The board scales down further on
// short phone viewports so the controls never slip below the browser chrome.
const BOARD_RENDER_HEIGHT = 720;

const colX = (col: number) => PAD_X + col * (CARD_WIDTH + COL_GAP);

interface DragState {
  cardIds: number[];
  offsetX: number;
  offsetY: number;
  pointerX: number;
  pointerY: number;
}

type CardSnap = { id: number; suit: string; value: number; faceUp: boolean };

interface DropZone {
  kind: "tableau" | "foundation";
  index: number;
  rect: { x: number; y: number; w: number; h: number };
}

interface CardAnim {
  /** CSS class that triggers the animation keyframe. */
  cls: "card-deal" | "card-draw";
  /** Delay in ms (for staggering). */
  delay: number;
  /** Origin position in reference px — card flies FROM here. */
  fromPos?: { x: number; y: number };
}

const formatTime = (s: number) => {
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
};

export default function Board() {
  const { snapshot, actions } = useSolitaire();
  const [drag, setDrag] = useState<DragState | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  const [popCardId, setPopCardId] = useState<number | null>(null);
  const lastClickRef = useRef<{ id: number; t: number }>({ id: -1, t: 0 });
  /** Card IDs that were in the waste pile as of the last committed render. */
  const prevWasteIdsRef = useRef<Set<number>>(new Set());
  /** Maps card ID → deal animation delay ms. Rebuilt once per game start. */
  const dealIdsRef = useRef<Map<number, number>>(new Map());
  /** Cards whose deal animation has finished — don’t re-animate them on pile changes. */
  const dealAnimatedRef = useRef<Set<number>>(new Set());
  /** Last game key seen in render — used to detect new-game synchronously. */
  const lastGameKeyRef = useRef<number>(-1);

  const playRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const dragFrameRef = useRef<number | null>(null);
  const [scale, setScale] = useState(1);

  // Fit the board to both the available width and height. This keeps the
  // footer visible even when Safari has its address and navigation bars open.
  useEffect(() => {
    const el = playRef.current;
    if (!el) return;
    const compute = () => {
      const r = el.getBoundingClientRect();
      const availW = Math.max(0, r.width - 4);
      const byWidth = availW / REF_BOARD_WIDTH;
      const byHeight = r.height / BOARD_RENDER_HEIGHT;
      setScale(Math.max(0.1, Math.min(byWidth, byHeight)));
    };
    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(el);
    window.addEventListener("resize", compute);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", compute);
    };
  }, []);

  // Deal SFX whenever a fresh game starts.
  useEffect(() => {
    audio.playSfx("deal");
  }, [snapshot.startTimeMs]);

  // Reset waste-tracking ref on every new game so all newly-dealt cards can
  // re-animate if they end up in the waste via a stock click.
  useEffect(() => {
    prevWasteIdsRef.current = new Set();
  }, [snapshot.startTimeMs]);

  // After each render, snapshot the current waste IDs so we can diff on the
  // next render to find cards that were just drawn from the stock.
  useEffect(() => {
    prevWasteIdsRef.current = new Set(snapshot.waste.map((c) => c.id));
  });

  const toBoardPx = (clientX: number, clientY: number) => {
    const el = playRef.current;
    if (!el) return { x: 0, y: 0 };
    const r = el.getBoundingClientRect();
    const boardW = REF_BOARD_WIDTH * scale;
    const ox = r.left + (r.width - boardW) / 2;
    const oy = r.top; // top-anchored
    return { x: (clientX - ox) / scale, y: (clientY - oy) / scale };
  };

  // Drop zones.
  const dropZones: DropZone[] = [];
  for (let i = 0; i < 4; i++) {
    dropZones.push({
      kind: "foundation",
      index: i,
      rect: { x: colX(3 + i), y: TOP_Y, w: CARD_WIDTH, h: CARD_HEIGHT },
    });
  }
  for (let c = 0; c < NUM_TABLEAU_COLUMNS; c++) {
    const cards = snapshot.tableaux[c];
    let h = CARD_HEIGHT;
    if (cards.length > 0) {
      const last = cards.length - 1;
      let dy = 0;
      for (let i = 0; i < last; i++) {
        dy += cards[i].faceUp ? TABLEAU_FACE_UP_OFFSET : TABLEAU_FACE_DOWN_OFFSET;
      }
      h = dy + CARD_HEIGHT;
    }
    dropZones.push({
      kind: "tableau",
      index: c,
      rect: { x: colX(c), y: TABLEAU_Y, w: CARD_WIDTH, h },
    });
  }

  const findDropZone = (x: number, y: number): DropZone | null => {
    for (const z of dropZones) {
      const { rect } = z;
      if (x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h) {
        return z;
      }
    }
    return null;
  };

  const triggerPop = (id: number) => {
    setPopCardId(id);
    window.setTimeout(() => setPopCardId((c) => (c === id ? null : c)), 260);
  };

  const onCardPointerDown = (
    e: React.PointerEvent,
    cardId: number,
    pileKind: "waste" | "tableau" | "foundation",
    pileIndex: number,
    cardIndexInPile: number,
  ) => {
    if (snapshot.state !== "playing") return;
    audio.unlock();
    e.preventDefault();
    // Capture on the stable play section so unmounting the dragged card
    // (we render it via the drag layer instead) does not cancel the gesture.
    playRef.current?.setPointerCapture?.(e.pointerId);

    const now = Date.now();
    if (lastClickRef.current.id === cardId && now - lastClickRef.current.t < 300) {
      lastClickRef.current = { id: -1, t: 0 };
      if (actions.tryAutoFoundation(cardId)) {
        audio.playSfx("draw");
        triggerPop(cardId);
        return;
      }
    }
    lastClickRef.current = { id: cardId, t: now };

    let cardIds: number[];
    let leadPos: { x: number; y: number };
    if (pileKind === "tableau") {
      const tabCards = snapshot.tableaux[pileIndex];
      const lead = tabCards[cardIndexInPile];
      if (!lead.faceUp) return;
      cardIds = tabCards.slice(cardIndexInPile).map((c) => c.id);
      let dy = 0;
      for (let i = 0; i < cardIndexInPile; i++) {
        dy += tabCards[i].faceUp ? TABLEAU_FACE_UP_OFFSET : TABLEAU_FACE_DOWN_OFFSET;
      }
      leadPos = { x: colX(pileIndex), y: TABLEAU_Y + dy };
    } else if (pileKind === "waste") {
      const wasteCards = snapshot.waste;
      if (cardIndexInPile !== wasteCards.length - 1) return;
      cardIds = [cardId];
      const fanStart =
        snapshot.drawMode === 3 ? Math.max(0, wasteCards.length - 3) : wasteCards.length - 1;
      const fanIdx = cardIndexInPile - fanStart;
      leadPos = { x: colX(1) + Math.max(0, fanIdx) * WASTE_FAN_OFFSET_X, y: TOP_Y };
    } else {
      const fCards = snapshot.foundations[pileIndex];
      if (cardIndexInPile !== fCards.length - 1) return;
      cardIds = [cardId];
      leadPos = { x: colX(3 + pileIndex), y: TOP_Y };
    }

    const { x, y } = toBoardPx(e.clientX, e.clientY);
    const nextDrag = {
      cardIds,
      offsetX: x - leadPos.x,
      offsetY: y - leadPos.y,
      pointerX: x,
      pointerY: y,
    };
    dragRef.current = nextDrag;
    setDrag(nextDrag);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const current = dragRef.current;
    if (!current) return;
    const { x, y } = toBoardPx(e.clientX, e.clientY);
    current.pointerX = x;
    current.pointerY = y;
    if (dragFrameRef.current !== null) return;
    dragFrameRef.current = window.requestAnimationFrame(() => {
      dragFrameRef.current = null;
      const active = dragRef.current;
      if (!active) return;
      active.cardIds.forEach((id, idx) => {
        const card = playRef.current?.querySelector<HTMLElement>(`[data-drag-id="${id}"]`);
        if (card) card.style.transform = `translate(${active.pointerX - active.offsetX}px, ${active.pointerY - active.offsetY + idx * TABLEAU_FACE_UP_OFFSET}px) scale(1.05) rotate(1.5deg)`;
      });
    });
  };

  const onPointerUp = (e: React.PointerEvent) => {
    const current = dragRef.current;
    if (!current) return;
    const { x, y } = toBoardPx(e.clientX, e.clientY);
    const cx = x - current.offsetX + CARD_WIDTH / 2;
    const cy = y - current.offsetY + CARD_HEIGHT / 2;
    const zone = findDropZone(cx, cy);
    if (zone) {
      const ok = actions.tryMove(current.cardIds, zone.kind, zone.index);
      if (ok) audio.playSfx("draw");
    }
    dragRef.current = null;
    if (dragFrameRef.current !== null) window.cancelAnimationFrame(dragFrameRef.current);
    dragFrameRef.current = null;
    setDrag(null);
  };

  const handleStockClick = () => {
    if (snapshot.state !== "playing") return;
    audio.unlock();
    actions.clickStock();
    audio.playSfx("draw");
  };

  const handleNewGame = () => {
    audio.unlock();
    actions.restart();
  };

  // Diff waste against previous render to find newly-drawn cards.
  const newWasteIds = snapshot.waste
    .map((c) => c.id)
    .filter((id) => !prevWasteIdsRef.current.has(id));
  const newWasteIdOrder = new Map(newWasteIds.map((id, i) => [id, i]));

  const stockPos = { x: colX(0), y: TOP_Y };
  const wastePos = (idx: number, total: number) => {
    if (snapshot.drawMode === 3 && total > 1) {
      const fanStart = Math.max(0, total - 3);
      if (idx >= fanStart) {
        return { x: colX(1) + (idx - fanStart) * WASTE_FAN_OFFSET_X, y: TOP_Y };
      }
    }
    return { x: colX(1), y: TOP_Y };
  };

  const renderCard = (
    c: CardSnap,
    pos: { x: number; y: number },
    onDown?: (e: React.PointerEvent) => void,
    anim?: CardAnim,
    zIndex?: number,
  ) => {
    const isDragging = drag?.cardIds.includes(c.id);
    const src = c.faceUp
      ? `/cards/${c.suit.toLowerCase()}/${c.suit.toLowerCase()}_card_${String(c.value).padStart(2, "0")}.${c.value >= 11 ? "png" : "webp"}`
      : "/cards/back.png";
    const popClass = popCardId === c.id ? "card-pop" : "";
    // --final-x/y are needed by cardPop and deal/draw keyframes.
    const style = {
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
      transform: `translate(${pos.x}px, ${pos.y}px)`,
      "--final-x": `${pos.x}px`,
      "--final-y": `${pos.y}px`,
      ...(anim?.fromPos
        ? { "--from-x": `${anim.fromPos.x}px`, "--from-y": `${anim.fromPos.y}px` }
        : {}),
      animationDelay: anim ? `${anim.delay}ms` : undefined,
      // Keep in DOM during drag (opacity:0) so React reuses the node after drop
      // — the CSS transform transition then fires from source → destination.
      opacity: isDragging ? 0 : 1,
      pointerEvents: (isDragging ? "none" : undefined) as React.CSSProperties["pointerEvents"],
      zIndex: isDragging ? 0 : (zIndex ?? "auto"),
    } as React.CSSProperties;
    return (
      <div
        key={`${c.id}-${snapshot.startTimeMs}`}
        className={`card-anim no-select no-touch absolute ${popClass} ${anim?.cls ?? ""}`}
        style={style}
        onPointerDown={isDragging ? undefined : onDown}
        onAnimationEnd={(e: React.AnimationEvent) => {
          // Once dealt, prevent re-triggering deal animation if card moves piles.
          if (e.animationName === "dealIn") dealAnimatedRef.current.add(c.id);
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={c.faceUp ? `${c.value} of ${c.suit}` : "card back"}
          draggable={false}
          className={`${c.value >= 11 && c.faceUp ? "" : "pixel-art"} h-full w-full select-none rounded-md shadow-md`}
        />
      </div>
    );
  };

  const stockCount = snapshot.stock.length;

  // ── Deal-animation tracking (synchronous — safe in render) ────────────
  if (lastGameKeyRef.current !== snapshot.startTimeMs) {
    lastGameKeyRef.current = snapshot.startTimeMs;
    dealAnimatedRef.current = new Set();
    const newDealIds = new Map<number, number>();
    snapshot.tableaux.forEach((stack, ti) => {
      stack.forEach((c, i) => {
        // Column ti has ti+1 initial cards; those are the deal cards.
        if (i <= ti) newDealIds.set(c.id, (ti + i) * 24);
      });
    });
    dealIdsRef.current = newDealIds;
  }

  // ── Flat card spec list ──────────────────────────────────────────
  // All cards in ONE array keyed by id-startTimeMs.
  // React reuses DOM nodes when a card moves piles → CSS transition animates it.
  interface CardSpec {
    c: CardSnap; pos: { x: number; y: number };
    onDown?: (e: React.PointerEvent) => void;
    anim?: CardAnim; z: number;
  }
  const cardSpecs: CardSpec[] = [];
  let zCtr = 1;

  snapshot.stock.slice(-3).forEach((c, i) => {
    cardSpecs.push({
      c,
      pos: { x: stockPos.x + Math.min(3, snapshot.stock.length - 1 - i), y: stockPos.y },
      onDown: (e) => { e.stopPropagation(); handleStockClick(); },
      z: zCtr++,
    });
  });

  snapshot.waste.forEach((c, i) => {
    const total = snapshot.waste.length;
    if (i < total - (snapshot.drawMode === 3 ? 3 : 1)) return;
    const pos = wastePos(i, total);
    const isTop = i === total - 1;
    const drawOrder = newWasteIdOrder.get(c.id);
    cardSpecs.push({
      c, pos,
      onDown: isTop ? (e) => onCardPointerDown(e, c.id, "waste", 0, i) : undefined,
      anim: drawOrder !== undefined
        ? { cls: "card-draw", delay: drawOrder * 60, fromPos: stockPos }
        : undefined,
      z: zCtr++,
    });
  });

  snapshot.foundations.forEach((stack, fi) => {
    stack.forEach((c, i) => {
      if (i !== stack.length - 1) return;
      const isTop = true;
      cardSpecs.push({
        c,
        pos: { x: colX(3 + fi), y: TOP_Y },
        onDown: isTop ? (e) => onCardPointerDown(e, c.id, "foundation", fi, i) : undefined,
        z: zCtr++,
      });
    });
  });

  snapshot.tableaux.forEach((stack, ti) => {
    let dy = 0;
    stack.forEach((c, i) => {
      const pos = { x: colX(ti), y: TABLEAU_Y + dy };
      dy += c.faceUp ? TABLEAU_FACE_UP_OFFSET : TABLEAU_FACE_DOWN_OFFSET;
      const dealDelay = dealIdsRef.current.get(c.id);
      const shouldDeal = dealDelay !== undefined && !dealAnimatedRef.current.has(c.id);
      cardSpecs.push({
        c, pos,
        onDown: c.faceUp ? (e) => onCardPointerDown(e, c.id, "tableau", ti, i) : undefined,
        anim: shouldDeal ? { cls: "card-deal", delay: dealDelay, fromPos: stockPos } : undefined,
        z: zCtr++,
      });
    });
  });

  return (
    <div
      className="mx-auto flex h-[100dvh] min-h-0 w-full max-w-[520px] flex-col overflow-hidden bg-black text-white"
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      {/* Header artwork */}
      <header className="relative w-full overflow-hidden" style={{ aspectRatio: "16 / 9" }}>
        <Image
          src="/backgrounds/top_background.webp"
          alt=""
          fill
          priority
          sizes="(max-width: 520px) 100vw, 520px"
          className="pixel-art object-cover"
        />
        <GameHeaderControls />
        {/* Timer */}
        <div className="font-pixel absolute bottom-1 right-2 rounded bg-black/55 px-2 py-1 text-[12px] tabular-nums">
          <GameTimer startTimeMs={snapshot.startTimeMs} stopped={snapshot.state === "won"} />
        </div>
      </header>

      {/* Wood line separator */}
      <div className="bg-wood-line h-3 w-full" aria-hidden />

      {/* Play area (felt) */}
      <section
        ref={playRef}
        className="bg-felt no-touch relative min-h-0 w-full flex-1 overflow-hidden"
      >
        <div
          className="absolute left-1/2 top-0 origin-top"
          style={{
            width: REF_BOARD_WIDTH,
            height: REF_BOARD_HEIGHT,
            // Layout zoom keeps the cards sharp when a drawn card animates.
            // Scaling the entire board as one composited layer blurred its siblings.
            zoom: scale,
            transform: "translateX(-50%)",
            transformOrigin: "top center",
          }}
        >
          {/* Stock surface (clickable) */}
          <div
            className="no-select absolute cursor-pointer rounded-md border-2 border-white/30 bg-white/10"
            style={{ width: CARD_WIDTH, height: CARD_HEIGHT, transform: `translate(${stockPos.x}px, ${stockPos.y}px)` }}
            onPointerDown={handleStockClick}
          >
            {stockCount === 0 && (
              <span className="flex h-full items-center justify-center text-2xl text-white/70">↻</span>
            )}
          </div>
          {/* Stock count badge */}
          {stockCount > 0 && (
            <div
              className="font-pixel pointer-events-none absolute rounded bg-black/55 px-1.5 py-0.5 text-[9px] text-white"
              style={{ transform: `translate(${stockPos.x + 4}px, ${stockPos.y + CARD_HEIGHT + 4}px)` }}
            >
              ×{stockCount}
            </div>
          )}
          {/* Waste placeholder */}
          <div
            className="absolute rounded-md border-2 border-white/20"
            style={{ width: CARD_WIDTH, height: CARD_HEIGHT, transform: `translate(${colX(1)}px, ${TOP_Y}px)` }}
          />
          {/* Foundations */}
          {[0, 1, 2, 3].map((i) => (
            <div
              key={`f-${i}`}
              className="absolute flex items-center justify-center rounded-md border-2 border-white/30"
              style={{ width: CARD_WIDTH, height: CARD_HEIGHT, transform: `translate(${colX(3 + i)}px, ${TOP_Y}px)` }}
            >
              {snapshot.foundations[i].length === 0 && (
                <span className="font-pixel text-2xl text-white/60">A</span>
              )}
            </div>
          ))}
          {/* Tableau placeholders */}
          {Array.from({ length: NUM_TABLEAU_COLUMNS }).map((_, c) => (
            <div
              key={`t-${c}`}
              className="absolute rounded-md border-2 border-white/20"
              style={{ width: CARD_WIDTH, height: CARD_HEIGHT, transform: `translate(${colX(c)}px, ${TABLEAU_Y}px)` }}
            />
          ))}

          {/* All cards in one flat list — composite key lets React reuse DOM nodes
               when a card moves between piles, so the CSS transform transition
               fires from the old position to the new one (no slide-from-origin). */}
          {cardSpecs.map(({ c, pos, onDown, anim, z }) =>
            renderCard(c, pos, onDown, anim, z),
          )}

          {/* Drag layer */}
          {drag &&
            drag.cardIds.map((id, idx) => {
              const c = findCardSnap(snapshot, id);
              if (!c) return null;
              const x = drag.pointerX - drag.offsetX;
              const y = drag.pointerY - drag.offsetY + idx * TABLEAU_FACE_UP_OFFSET;
              const src = c.faceUp
                ? `/cards/${c.suit.toLowerCase()}/${c.suit.toLowerCase()}_card_${String(c.value).padStart(2, "0")}.${c.value >= 11 ? "png" : "webp"}`
                : "/cards/back.png";
              return (
                <div
                  key={`drag-${id}`}
                  data-drag-id={id}
                  className="card-anim dragging no-touch absolute pointer-events-none"
                  style={{
                    width: CARD_WIDTH,
                    height: CARD_HEIGHT,
                    zIndex: 9999,
                    transform: `translate(${x}px, ${y}px) scale(1.05) rotate(1.5deg)`,
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={src}
                    alt=""
                    draggable={false}
                    className={`${c.value >= 11 && c.faceUp ? "" : "pixel-art"} h-full w-full rounded-md`}
                  />
                </div>
              );
            })}
        </div>
      </section>

      {/* Footer button bar */}
      <Controls
        score={snapshot.score}
        canUndo={snapshot.canUndo}
        onUndo={actions.undo}
        onNewGame={handleNewGame}
        onSettings={() => setShowSettings(true)}
      />

      {showSettings && (
        <SettingsModal
          drawMode={snapshot.drawMode}
          onChangeDrawMode={(m: DrawMode) => {
            actions.setDrawMode(m);
            setShowSettings(false);
          }}
          onClose={() => setShowSettings(false)}
        />
      )}

      {snapshot.state === "won" && (
        <WinModal
          score={snapshot.score}
          elapsedSec={Math.floor((Date.now() - snapshot.startTimeMs) / 1000)}
          onPlayAgain={handleNewGame}
        />
      )}
    </div>
  );
}

function findCardSnap(
  snap: ReturnType<typeof useSolitaire>["snapshot"],
  id: number,
): CardSnap | null {
  for (const c of snap.stock) if (c.id === id) return c;
  for (const c of snap.waste) if (c.id === id) return c;
  for (const f of snap.foundations) for (const c of f) if (c.id === id) return c;
  for (const t of snap.tableaux) for (const c of t) if (c.id === id) return c;
  return null;
}

function GameTimer({ startTimeMs, stopped }: { startTimeMs: number; stopped: boolean }) {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    if (stopped) return;
    const tick = () => setSeconds(Math.floor((Date.now() - startTimeMs) / 1000));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [startTimeMs, stopped]);
  return <>{formatTime(seconds)}</>;
}
