"use client";

// Backgammon main board screen.
// Layout (top→bottom):
//   1. Header (16:9 pixel-art) — music pill, Back link, timer
//   2. Wood line separator
//   3. Status row (active player + pip counts)
//   4. Square board with overlay grid (responsive)
//   5. Bear-off / dice tray strip
//   6. Footer controls (Geri Al / Yeni El / Score / Ayarlar / Çıkış)

import Image from "next/image";
import GameHeaderControls, { GameHomeLink } from "../../../components/GameHeaderControls";
import { useEffect, useState } from "react";
import { audio } from "../../solitaire/audio";
import type {
  BackgammonColor,
  MoveSource,
  MoveTarget,
} from "../types";
import { useBackgammon } from "../useBackgammon";
import Controls from "./Controls";
import Die from "./Die";
import WinModal from "./WinModal";

const formatTime = (s: number) => {
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
};

// ── Point index layout ─────────────────────────────────────────────────
// Visual rows (left→right) per the design:
const TOP_LEFT = [12, 13, 14, 15, 16, 17];   // points 13..18
const TOP_RIGHT = [18, 19, 20, 21, 22, 23];  // points 19..24
const BOT_LEFT = [11, 10, 9, 8, 7, 6];       // points 12..7
const BOT_RIGHT = [5, 4, 3, 2, 1, 0];        // points 6..1

export default function BackgammonBoard() {
  const { state, legalMoves, actions, canEndTurn, canUndo, movesFromSource } =
    useBackgammon();

  const [elapsed, setElapsed] = useState(0);
  const [startTime] = useState(() => Date.now());
  const [selected, setSelected] = useState<MoveSource | null>(null);

  // Tick timer.
  useEffect(() => {
    if (state.winner) return;
    const id = window.setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 500);
    return () => window.clearInterval(id);
  }, [state.winner, startTime]);

  // Drop selection if it became invalid (e.g. after undo / new turn).
  useEffect(() => {
    if (selected === null) return;
    const has = legalMoves.some((m) => m.from === selected);
    if (!has) setSelected(null);
  }, [legalMoves, selected]);

  // Auto-select bar when forced.
  useEffect(() => {
    if (state.phase !== "moving") return;
    if (state.board.bar[state.activeColor] > 0 && selected !== "bar") {
      setSelected("bar");
    }
  }, [state.phase, state.board.bar, state.activeColor, selected]);


  // ── Click handlers ────────────────────────────────────────────────────
  const handlePointClick = (idx: MoveSource) => {
    if (state.phase !== "moving") return;
    audio.unlock();

    // Bar-entry mandatory: only "bar" can be selected.
    if (state.board.bar[state.activeColor] > 0) {
      if (idx === "bar") setSelected("bar");
      else {
        // Try as destination from bar.
        attemptMove("bar", idx);
      }
      return;
    }

    // A legal destination takes priority, including points with our own stones.
    if (selected !== null) {
      if (selected === idx) {
        setSelected(null);
        return;
      }
      if (idx !== "bar" && legalMoves.some((m) => m.from === selected && m.to === idx)) {
        attemptMove(selected, idx);
        return;
      }
      if (idx !== "bar" && state.board.points[idx].owner === state.activeColor && movesFromSource(idx).length > 0) {
        setSelected(idx);
      }
      return;
    }

    // Otherwise, this click is a source.
    if (idx === "bar") return;
    const owns =
      state.board.points[idx].owner === state.activeColor &&
      state.board.points[idx].count > 0;
    if (!owns) return;
    if (movesFromSource(idx).length === 0) return;
    setSelected(idx);
  };

  const handleBearOffClick = () => {
    if (selected === null) return;
    attemptMove(selected, "off");
  };

  const attemptMove = (from: MoveSource, to: MoveTarget) => {
    const candidates = legalMoves.filter((m) => m.from === from && m.to === to);
    if (candidates.length === 0) return;
    // Prefer the smaller die (frees big die for harder follow-up).
    const move = candidates.sort((a, b) => a.die - b.die)[0];
    actions.playMove({ from: move.from, to: move.to, die: move.die });
    audio.playSfx("draw");
    setSelected(null);
  };

  // Highlights for the currently selected source.
  const targetHighlights = new Set<MoveTarget>();
  if (selected !== null) {
    for (const m of legalMoves) {
      if (m.from === selected) targetHighlights.add(m.to);
    }
  }

  // Sources that have at least one legal move (subtle hint).
  const movableSources = new Set<MoveSource>();
  for (const m of legalMoves) movableSources.add(m.from);

  const isWhiteTurn = state.activeColor === "white";
  const playerName = (color: BackgammonColor) => state.yarenColor === null ? "" : color === state.yarenColor ? "Yaren" : "Eren";

  return (
    <div className="backgammon-screen mx-auto flex h-[100dvh] w-full max-w-[560px] flex-col overflow-hidden bg-black text-white">
      {/* ─────────── Header artwork ─────────── */}
      <header
        className="backgammon-header relative w-full shrink-0 overflow-hidden"
      >
        <Image
          src="/backgrounds/top_background.webp"
          alt=""
          fill
          priority
          sizes="(max-width: 560px) 100vw, 560px"
          className="pixel-art object-cover"
        />
        <GameHeaderControls />
        <div className="font-pixel absolute bottom-1 right-2 rounded bg-black/55 px-2 py-1 text-[12px] tabular-nums">
          {formatTime(elapsed)}
        </div>
      </header>

      <div className="bg-wood-line h-3 w-full" aria-hidden />

      {/* ─────────── Status / action bar ─────────── */}
      {/* Sequentially shows: message (e.g. "Beyaz başlıyor"), rolled dice, Bitir button. */}
      <div className="backgammon-status grid shrink-0 grid-cols-[1fr_auto] items-center gap-x-2 gap-y-1 bg-[#1d2820] px-2 py-1 text-xs">
        <div className="flex items-center gap-2">
          <PlayerBadge
            color="white"
            name={playerName("white")}
            active={state.phase !== "ended" && isWhiteTurn}
          />
          <PlayerBadge
            color="black"
            name={playerName("black")}
            active={state.phase !== "ended" && !isWhiteTurn}
          />
        </div>
        <div className="turn-label font-pixel min-w-0 text-left text-[10px] text-amber-200/90">
          {state.phase === "choosing" ? "Oyuncu seçimi" : `${playerName(state.activeColor)}’in sırası`}
          {state.message && <span className="hidden sm:inline"> · {state.message}</span>}
        </div>
        <div className="flex items-center gap-1.5">
          {state.dice.map((d) => (
            <Die key={d.id} value={d.value} used={d.used} />
          ))}
        </div>
        <button
          type="button"
          disabled={!canEndTurn}
          onClick={() => {
            audio.unlock();
            actions.endTurn();
          }}
          className="pixel-btn pixel-btn-green min-w-[58px] text-[9px]"
        >
          Turu Bitir
        </button>
      </div>

      {/* ─────────── Board ─────────── */}
      <section className="bg-felt no-touch flex min-h-0 flex-1 flex-col items-center justify-center overflow-hidden px-2 py-1">
        <div className="bg-board-frame backgammon-board relative aspect-square w-full max-w-[520px] rounded-md p-[3.5%] shadow-[0_8px_24px_rgba(0,0,0,0.45)]">
          <div className="bg-board-felt absolute inset-[3.5%] grid grid-cols-[1fr_6fr_0.9fr_6fr_1fr] grid-rows-[1fr_1fr] overflow-hidden rounded-sm">
            {/* Left bear-off column (top + bottom halves) */}
            <BearOffColumn
              color="black"
              count={state.board.borneOff.black}
              row="top"
            />
            {/* Top-left 6 points */}
            <PointRow
              indexes={TOP_LEFT}
              orientation="top"
              numberPlacement="below"
              board={state.board}
              selected={selected}
              targets={targetHighlights}
              movable={movableSources}
              activeColor={state.activeColor}
              lastMove={state.lastMove}
              onClick={handlePointClick}
            />
            {/* Bar (top half) */}
            <BarHalf
              half="top"
              color="black"
              count={state.board.bar.black}
              activeColor={state.activeColor}
              barSelected={selected === "bar" && state.activeColor === "black"}
              barIsTarget={
                state.activeColor === "white" &&
                Array.from(targetHighlights).some(
                  (t) => typeof t === "number" && TOP_LEFT.includes(t),
                )
              }
              onBarClick={() => handlePointClick("bar")}
            />
            {/* Top-right 6 points */}
            <PointRow
              indexes={TOP_RIGHT}
              orientation="top"
              numberPlacement="below"
              board={state.board}
              selected={selected}
              targets={targetHighlights}
              movable={movableSources}
              activeColor={state.activeColor}
              lastMove={state.lastMove}
              onClick={handlePointClick}
            />
            {/* Right bear-off column (top half) */}
            <BearOffColumn
              color="white"
              count={state.board.borneOff.white}
              row="top"
              isTarget={
                isWhiteTurn && targetHighlights.has("off")
              }
              onClick={
                isWhiteTurn && targetHighlights.has("off")
                  ? handleBearOffClick
                  : undefined
              }
            />

            {/* Left bear-off (bottom) */}
            <BearOffColumn
              color="white"
              count={state.board.borneOff.white}
              row="bottom"
            />
            {/* Bottom-left 6 points */}
            <PointRow
              indexes={BOT_LEFT}
              orientation="bottom"
              numberPlacement="above"
              board={state.board}
              selected={selected}
              targets={targetHighlights}
              movable={movableSources}
              activeColor={state.activeColor}
              lastMove={state.lastMove}
              onClick={handlePointClick}
            />
            {/* Bar (bottom half) */}
            <BarHalf
              half="bottom"
              color="white"
              count={state.board.bar.white}
              activeColor={state.activeColor}
              barSelected={selected === "bar" && state.activeColor === "white"}
              barIsTarget={
                state.activeColor === "black" &&
                Array.from(targetHighlights).some(
                  (t) => typeof t === "number" && BOT_LEFT.includes(t),
                )
              }
              onBarClick={() => handlePointClick("bar")}
            />
            {/* Bottom-right 6 points */}
            <PointRow
              indexes={BOT_RIGHT}
              orientation="bottom"
              numberPlacement="above"
              board={state.board}
              selected={selected}
              targets={targetHighlights}
              movable={movableSources}
              activeColor={state.activeColor}
              lastMove={state.lastMove}
              onClick={handlePointClick}
            />
            {/* Right bear-off (bottom) */}
            <BearOffColumn
              color="black"
              count={state.board.borneOff.black}
              row="bottom"
              isTarget={!isWhiteTurn && targetHighlights.has("off")}
              onClick={
                !isWhiteTurn && targetHighlights.has("off")
                  ? handleBearOffClick
                  : undefined
              }
            />
          </div>
        </div>

      </section>

      {/* ─────────── Footer controls ─────────── */}
      <Controls
        canUndo={canUndo}
        rollLabel="Zar At"
        rollDisabled={state.phase !== "rolling"}
        onRoll={() => {
          audio.unlock();
          if (state.phase === "rolling") actions.rollDice();
        }}
        onUndo={() => {
          audio.unlock();
          actions.undo();
        }}
        onNewGame={() => {
          audio.unlock();
          actions.restart();
        }}
        onSettings={() => {
          /* placeholder — settings could be added later */
        }}
      />

      {state.phase === "choosing" && (
        <div role="dialog" aria-modal="true" aria-labelledby="color-title" className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-5 backdrop-blur-sm">
          <div className="relative w-full max-w-sm rounded-2xl border border-amber-200/40 bg-[#241b2d] p-7 text-center shadow-2xl">
            <GameHomeLink className="absolute right-3 top-3 !h-10 !w-10" />
            <div className="mb-3 text-4xl" aria-hidden>🎲</div>
            <h2 id="color-title" className="text-xl font-semibold text-amber-100">Yaren hangi tarafta olmak istersin?</h2>
            <p className="mt-2 text-sm text-amber-100/65">Seçtiğin taşlarla ilk zarı sen atarsın.</p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              {(["white", "black"] as const).map((color) => (
                <button key={color} type="button" onClick={() => actions.chooseColor(color)} className="flex min-h-20 flex-col items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/10 font-semibold text-white transition hover:bg-white/20">
                  <span className={`stone ${color === "white" ? "stone-white" : "stone-black"}`} aria-hidden />
                  {color === "white" ? "Beyaz" : "Siyah"}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {state.winner && (
        <WinModal
          winner={state.winner}
          playerName={playerName(state.winner)}
          elapsedSec={elapsed}
          onPlayAgain={() => actions.restart()}
        />
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────
// Sub-components
// ──────────────────────────────────────────────────────────────────────

function PlayerBadge({
  color,
  name,
  active,
}: {
  color: BackgammonColor;
  name: string;
  active: boolean;
}) {
  const label = color === "white" ? "Beyaz" : "Siyah";
  return (
    <div
      className={`font-pixel flex items-center gap-1.5 rounded border px-2 py-1 text-[10px] ${
        active
          ? color === "white"
            ? "border-amber-300 bg-amber-100/15 text-amber-100"
            : "border-sky-300 bg-sky-100/15 text-sky-100"
          : "border-white/15 text-white/50"
      }`}
    >
      <span
        aria-hidden
        className={`inline-block h-3 w-3 rounded-full border border-black ${
          color === "white" ? "bg-stone-100" : "bg-slate-800"
        }`}
      />
      <span>{name ? `${name} · ` : ""}{label}</span>
    </div>
  );
}

interface PointRowProps {
  indexes: number[];
  orientation: "top" | "bottom";
  numberPlacement: "above" | "below";
  board: import("../types").BoardState;
  selected: MoveSource | null;
  targets: Set<MoveTarget>;
  movable: Set<MoveSource>;
  activeColor: BackgammonColor;
  lastMove: import("../types").LastMove | null;
  onClick: (idx: MoveSource) => void;
}

function PointRow({
  indexes,
  orientation,
  numberPlacement,
  board,
  selected,
  targets,
  movable,
  activeColor,
  lastMove,
  onClick,
}: PointRowProps) {
  return (
    <div className="grid grid-cols-6">
      {indexes.map((idx, i) => {
        const point = board.points[idx];
        const isAlt = (i + (orientation === "top" ? 0 : 1)) % 2 === 0;
        const isSelected = selected === idx;
        const isTarget = targets.has(idx);
        const isMovable = movable.has(idx) && activeColor === point.owner;
        const isLastFrom = lastMove?.from === idx;
        const isLastTo = lastMove?.to === idx;
        return (
          <Point
            key={`p-${idx}`}
            label={String(idx + 1)}
            orientation={orientation}
            numberPlacement={numberPlacement}
            triangleVariant={isAlt ? "tan" : "green"}
            count={point.count}
            owner={point.owner}
            isSelected={isSelected}
            isTarget={isTarget}
            isMovable={isMovable}
            isLastFrom={isLastFrom}
            isLastTo={isLastTo}
            onClick={() => onClick(idx)}
          />
        );
      })}
    </div>
  );
}

function Point({
  label,
  orientation,
  numberPlacement,
  triangleVariant,
  count,
  owner,
  isSelected,
  isTarget,
  isMovable,
  isLastFrom,
  isLastTo,
  onClick,
}: {
  label: string;
  orientation: "top" | "bottom";
  numberPlacement: "above" | "below";
  triangleVariant: "tan" | "green";
  count: number;
  owner: BackgammonColor | null;
  isSelected: boolean;
  isTarget: boolean;
  isMovable: boolean;
  isLastFrom: boolean;
  isLastTo: boolean;
  onClick: () => void;
}) {
  // Triangle points down (top row) or up (bottom row).
  const triClass =
    orientation === "top" ? "tri-down" : "tri-up";
  const variantClass =
    triangleVariant === "tan" ? "tri-tan" : "tri-green";

  // Stones: stack from outer edge inward.
  const visibleStones = Math.min(count, 5);
  const overflow = count > 5 ? count - 5 : 0;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Point ${label}`}
      className={`relative flex flex-col ${
        orientation === "top" ? "" : "justify-end"
      } items-center transition`}
    >
      {/* Number label removed per design — board no longer shows point indexes. */}

      <div className="point-area relative w-full flex-1">
        {/* Triangle shape */}
        <div
          className={`absolute inset-0 ${triClass} ${variantClass} ${
            isTarget ? "ring-target" : ""
          } ${isLastFrom ? "ring-last-from" : ""} ${
            isLastTo ? "ring-last-to" : ""
          } ${isSelected ? "ring-selected" : ""} ${
            isMovable ? "ring-movable" : ""
          }`}
          aria-hidden
        />
        {/* Stones */}
        <div
          className={`absolute inset-x-0 flex flex-col items-center gap-[2px] ${
            orientation === "top"
              ? "top-[2%] flex-col"
              : "bottom-[2%] flex-col-reverse"
          }`}
        >
          {Array.from({ length: visibleStones }).map((_, i) => (
            <Stone
              key={i}
              owner={owner}
              isFirst={i === visibleStones - 1 && overflow > 0}
              overflowCount={i === visibleStones - 1 && overflow > 0 ? count : null}
            />
          ))}
        </div>
        {/* Pulsing dot: indicates this point is a valid move target */}
        {isTarget && <div className="point-target-dot" aria-hidden />}
      </div>

      {numberPlacement === "below" && null}
    </button>
  );
}

function Stone({
  owner,
  overflowCount,
}: {
  owner: BackgammonColor | null;
  isFirst: boolean;
  overflowCount: number | null;
}) {
  if (!owner) return null;
  return (
    <div
      className={`stone ${owner === "white" ? "stone-white" : "stone-black"}`}
      aria-hidden
    >
      {overflowCount !== null && (
        <span className="stone-count">{overflowCount}</span>
      )}
    </div>
  );
}

function BarHalf({
  half,
  count,
  activeColor,
  barSelected,
  barIsTarget,
  onBarClick,
}: {
  half: "top" | "bottom";
  /** Owner of the bar checkers shown in this half. */
  color: BackgammonColor;
  count: number;
  activeColor: BackgammonColor;
  barSelected: boolean;
  barIsTarget: boolean;
  onBarClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={count > 0 && (count > 0 || activeColor) ? onBarClick : undefined}
      className={`bar-half relative ${
        barSelected ? "bar-selected" : ""
      } ${barIsTarget ? "bar-target" : ""}`}
      aria-label={`Bar ${half}`}
    >
      {/* Hinges */}
      <div className="bar-hinge bar-hinge-top" aria-hidden />
      <div className="bar-hinge bar-hinge-bot" aria-hidden />
      {/* Stones on bar */}
      {count > 0 && (
        <div
          className={`absolute inset-x-0 flex flex-col items-center gap-[2px] ${
            half === "top" ? "top-[8%]" : "bottom-[8%] flex-col-reverse"
          }`}
        >
          {Array.from({ length: Math.min(count, 4) }).map((_, i) => (
            <div
              key={i}
              className={`stone ${
                /* The stones in the top half belong to black, bottom to white */
                half === "top" ? "stone-black" : "stone-white"
              }`}
            >
              {i === Math.min(count, 4) - 1 && count > 4 && (
                <span className="stone-count">{count}</span>
              )}
            </div>
          ))}
        </div>
      )}
      {/* Bar label removed: empty bar shows nothing; checkers visible when present. */}
    </button>
  );
}

function BearOffColumn({
  color,
  count,
  row,
  isTarget,
  onClick,
}: {
  color: BackgammonColor;
  count: number;
  row: "top" | "bottom";
  isTarget?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      aria-label={`${color} bear off ${row}`}
      className={`bear-col relative ${isTarget ? "bear-target" : ""}`}
    >
      <div
        className={`absolute inset-x-1 flex flex-col items-center gap-[1px] ${
          row === "top" ? "top-1" : "bottom-1 flex-col-reverse"
        }`}
      >
        {Array.from({ length: Math.min(count, 8) }).map((_, i) => (
          <div
            key={i}
            className={`bear-stone ${
              color === "white" ? "stone-white" : "stone-black"
            }`}
          />
        ))}
      </div>
      {count > 0 && row === "bottom" && (
        <span className="font-pixel absolute inset-x-0 bottom-0 text-center text-[7px] text-white/60">
          {count}
        </span>
      )}
    </button>
  );
}
