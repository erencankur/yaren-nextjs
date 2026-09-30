// Pure Backgammon rule engine. No React, no DOM.
//
// Implements modern Backgammon rules:
//  - bar entry is mandatory while a checker is on the bar
//  - blots can be hit, blocked points (>=2 opponent) cannot be entered
//  - bearing off requires all 15 checkers in home board
//  - exact bear-off + higher-die fallback (only farthest checker)
//  - mandatory dice play: if both dice can be played, both must be
//  - if only one die can be played, the higher die is required when possible

import type {
  BackgammonColor,
  BackgammonLegalMove,
  BackgammonMove,
  BoardState,
  PointState,
} from "./types";

// ── Constants ──────────────────────────────────────────────────────────
export const NUM_POINTS = 24;
export const CHECKERS_PER_PLAYER = 15;

// White home: 0..5  Black home: 18..23
export const isWhiteHome = (i: number) => i >= 0 && i <= 5;
export const isBlackHome = (i: number) => i >= 18 && i <= 23;

export function oppositeColor(c: BackgammonColor): BackgammonColor {
  return c === "white" ? "black" : "white";
}

// ── Board factory ──────────────────────────────────────────────────────
export function createInitialBoard(): BoardState {
  const points: PointState[] = Array.from({ length: NUM_POINTS }, () => ({
    owner: null,
    count: 0,
  }));
  // White
  points[23] = { owner: "white", count: 2 };
  points[12] = { owner: "white", count: 5 };
  points[7] = { owner: "white", count: 3 };
  points[5] = { owner: "white", count: 5 };
  // Black
  points[0] = { owner: "black", count: 2 };
  points[11] = { owner: "black", count: 5 };
  points[16] = { owner: "black", count: 3 };
  points[18] = { owner: "black", count: 5 };
  return {
    points,
    bar: { white: 0, black: 0 },
    borneOff: { white: 0, black: 0 },
  };
}

export function cloneBoard(b: BoardState): BoardState {
  return {
    points: b.points.map((p) => ({ owner: p.owner, count: p.count })),
    bar: { white: b.bar.white, black: b.bar.black },
    borneOff: { white: b.borneOff.white, black: b.borneOff.black },
  };
}

// ── Pip counts ─────────────────────────────────────────────────────────
export function calculatePipCounts(
  board: BoardState,
): Record<BackgammonColor, number> {
  let white = 0;
  let black = 0;
  for (let i = 0; i < NUM_POINTS; i++) {
    const p = board.points[i];
    if (!p.owner) continue;
    if (p.owner === "white") white += (i + 1) * p.count;
    else black += (NUM_POINTS - i) * p.count;
  }
  // Bar checker distance is 25.
  white += board.bar.white * 25;
  black += board.bar.black * 25;
  return { white, black };
}

export function hasAllCheckersHome(
  board: BoardState,
  color: BackgammonColor,
): boolean {
  if (board.bar[color] > 0) return false;
  for (let i = 0; i < NUM_POINTS; i++) {
    const p = board.points[i];
    if (p.owner !== color) continue;
    const inHome = color === "white" ? isWhiteHome(i) : isBlackHome(i);
    if (!inHome) return false;
  }
  return true;
}

// ── Single-die candidate moves ─────────────────────────────────────────
// All single-die moves possible given the board, color and ONE die value.
// Does not consider mandatory-play sequencing — only physical legality.
function getSingleDieCandidates(
  board: BoardState,
  color: BackgammonColor,
  die: number,
): BackgammonLegalMove[] {
  const moves: BackgammonLegalMove[] = [];

  // Bar entry takes precedence.
  if (board.bar[color] > 0) {
    const dest = color === "white" ? NUM_POINTS - die : die - 1;
    if (dest >= 0 && dest < NUM_POINTS) {
      const target = board.points[dest];
      if (!target.owner || target.owner === color || target.count === 1) {
        moves.push({
          from: "bar",
          to: dest,
          die,
          hit: target.owner !== null && target.owner !== color && target.count === 1,
          bearsOff: false,
        });
      }
    }
    return moves;
  }

  // Normal moves from each owned point.
  for (let i = 0; i < NUM_POINTS; i++) {
    const p = board.points[i];
    if (p.owner !== color || p.count === 0) continue;
    const dest = color === "white" ? i - die : i + die;

    if (dest >= 0 && dest < NUM_POINTS) {
      const target = board.points[dest];
      if (!target.owner || target.owner === color || target.count === 1) {
        moves.push({
          from: i,
          to: dest,
          die,
          hit: target.owner !== null && target.owner !== color && target.count === 1,
          bearsOff: false,
        });
      }
    } else if (hasAllCheckersHome(board, color)) {
      // Bearing off candidate.
      const exactDie = color === "white" ? i + 1 : NUM_POINTS - i;
      if (die === exactDie) {
        moves.push({ from: i, to: "off", die, hit: false, bearsOff: true });
      } else if (die > exactDie) {
        // Higher-die fallback: legal only if no own checker is farther from off.
        const farther =
          color === "white"
            ? board.points
                .slice(i + 1)
                .some((q) => q.owner === "white" && q.count > 0)
            : board.points
                .slice(0, i)
                .some((q) => q.owner === "black" && q.count > 0);
        if (!farther) {
          moves.push({ from: i, to: "off", die, hit: false, bearsOff: true });
        }
      }
    }
  }
  return moves;
}

// Apply a single move to a (cloned) board. Returns the new board.
export function applyMove(
  board: BoardState,
  color: BackgammonColor,
  move: BackgammonMove,
): BoardState {
  const next = cloneBoard(board);

  // Remove from source.
  if (move.from === "bar") {
    next.bar[color] -= 1;
  } else {
    const src = next.points[move.from];
    src.count -= 1;
    if (src.count === 0) src.owner = null;
  }

  // Place / hit on destination.
  if (move.to === "off") {
    next.borneOff[color] += 1;
  } else {
    const tgt = next.points[move.to];
    if (tgt.owner && tgt.owner !== color && tgt.count === 1) {
      // Hit.
      next.bar[oppositeColor(color)] += 1;
      tgt.owner = color;
      tgt.count = 1;
    } else {
      tgt.owner = color;
      tgt.count += 1;
    }
  }
  return next;
}

// ── Mandatory-play sequence search ─────────────────────────────────────
// Returns the maximum number of dice that can be played in any sequence,
// starting from this board with these remaining dice.
function maxPlayableLength(
  board: BoardState,
  color: BackgammonColor,
  remaining: number[],
): number {
  if (remaining.length === 0) return 0;
  let best = 0;
  // Try each distinct die.
  const seen = new Set<number>();
  for (let i = 0; i < remaining.length; i++) {
    const die = remaining[i];
    if (seen.has(die)) continue;
    seen.add(die);
    const candidates = getSingleDieCandidates(board, color, die);
    if (candidates.length === 0) continue;
    for (const c of candidates) {
      const next = applyMove(board, color, c);
      const restRemaining = [...remaining.slice(0, i), ...remaining.slice(i + 1)];
      const sub = 1 + maxPlayableLength(next, color, restRemaining);
      if (sub > best) best = sub;
      if (best === remaining.length) return best;
    }
  }
  return best;
}

// ── Public legal move generator ────────────────────────────────────────
// Returns the FIRST move in every maximum-length playable sequence.
// Enforces mandatory-play and higher-die rules.
export function getLegalMoves(
  board: BoardState,
  color: BackgammonColor,
  remainingDice: number[],
): BackgammonLegalMove[] {
  if (remainingDice.length === 0) return [];

  const targetLen = maxPlayableLength(board, color, remainingDice);
  if (targetLen === 0) return [];

  const out: BackgammonLegalMove[] = [];
  const dedup = new Set<string>();
  const seenDie = new Set<number>();

  for (let i = 0; i < remainingDice.length; i++) {
    const die = remainingDice[i];
    if (seenDie.has(die)) continue;
    seenDie.add(die);
    const candidates = getSingleDieCandidates(board, color, die);
    for (const c of candidates) {
      const next = applyMove(board, color, c);
      const restRemaining = [...remainingDice.slice(0, i), ...remainingDice.slice(i + 1)];
      const sub = 1 + maxPlayableLength(next, color, restRemaining);
      if (sub === targetLen) {
        const key = `${c.from}:${c.to}:${c.die}`;
        if (!dedup.has(key)) {
          dedup.add(key);
          out.push(c);
        }
      }
    }
  }

  // Higher-die rule: when only one of two non-double, non-equal dice is playable,
  // the higher one must be used if it can be.
  if (
    targetLen === 1 &&
    remainingDice.length === 2 &&
    remainingDice[0] !== remainingDice[1]
  ) {
    const higher = Math.max(remainingDice[0], remainingDice[1]);
    const higherMoves = out.filter((m) => m.die === higher);
    if (higherMoves.length > 0) return higherMoves;
  }

  return out;
}

// ── Winner detection ───────────────────────────────────────────────────
export function detectWinner(board: BoardState): BackgammonColor | null {
  if (board.borneOff.white >= CHECKERS_PER_PLAYER) return "white";
  if (board.borneOff.black >= CHECKERS_PER_PLAYER) return "black";
  return null;
}
