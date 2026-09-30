"use client";

// React hook + reducer for local two-player Backgammon.
import { useCallback, useMemo, useReducer } from "react";
import {
  applyMove,
  calculatePipCounts,
  createInitialBoard,
  detectWinner,
  getLegalMoves,
} from "./rules";
import type {
  BackgammonColor,
  BackgammonMove,
  DieState,
  HistoryEntry,
  LocalBackgammonState,
} from "./types";

// ── Helpers ────────────────────────────────────────────────────────────
function rollD6(): number {
  return 1 + Math.floor(Math.random() * 6);
}
function makeId(): string {
  return Math.random().toString(36).slice(2, 9);
}

function diceToValues(dice: DieState[]): number[] {
  return dice.filter((d) => !d.used).map((d) => d.value);
}

function snapshotForHistory(s: LocalBackgammonState): HistoryEntry {
  return {
    board: {
      points: s.board.points.map((p) => ({ owner: p.owner, count: p.count })),
      bar: { white: s.board.bar.white, black: s.board.bar.black },
      borneOff: { white: s.board.borneOff.white, black: s.board.borneOff.black },
    },
    dice: s.dice.map((d) => ({ ...d })),
    phase: s.phase,
    lastMove: s.lastMove ? { ...s.lastMove } : null,
    message: s.message,
  };
}

function createInitial(): LocalBackgammonState {
  const board = createInitialBoard();
  return {
    phase: "choosing",
    board,
    activeColor: "white",
    dice: [],
    yarenColor: null,
    pipCounts: calculatePipCounts(board),
    history: [],
    lastMove: null,
    winner: null,
    message: null,
  };
}

// ── Action types ───────────────────────────────────────────────────────
type Action =
  | { type: "RESTART" }
  | { type: "CHOOSE_COLOR"; color: BackgammonColor }
  | { type: "ROLL_DICE" }
  | { type: "PLAY_MOVE"; move: BackgammonMove }
  | { type: "UNDO" }
  | { type: "END_TURN" };

// ── Reducer ────────────────────────────────────────────────────────────
function reducer(s: LocalBackgammonState, a: Action): LocalBackgammonState {
  switch (a.type) {
    // ── Restart ────────────────────────────────────────────────────────
    case "RESTART":
      return createInitial();

    case "CHOOSE_COLOR":
      if (s.phase !== "choosing") return s;
      return { ...s, yarenColor: a.color, activeColor: a.color, phase: "rolling", message: null };

    // ── Roll for normal turn ───────────────────────────────────────────
    case "ROLL_DICE": {
      if (s.phase !== "rolling") return s;
      const a1 = rollD6();
      const a2 = rollD6();
      const dice: DieState[] =
        a1 === a2
          ? [
              { id: makeId(), value: a1, used: false },
              { id: makeId(), value: a1, used: false },
              { id: makeId(), value: a1, used: false },
              { id: makeId(), value: a1, used: false },
            ]
          : [
              { id: makeId(), value: a1, used: false },
              { id: makeId(), value: a2, used: false },
            ];

      // If no legal moves at all, pass automatically.
      const legal = getLegalMoves(s.board, s.activeColor, diceToValues(dice));
      if (legal.length === 0) {
        return {
          ...s,
          dice,
          phase: "moving",
          message: "Oynanabilir hamle yok. Turu bitir.",
          history: [],
          lastMove: null,
        };
      }

      return {
        ...s,
        dice,
        phase: "moving",
        history: [],
        lastMove: null,
        message:
          a1 === a2
            ? `Çift ${a1}! Dört hamle hakkı var.`
            : `Zar: ${a1}-${a2}.`,
      };
    }

    // ── Play move ──────────────────────────────────────────────────────
    case "PLAY_MOVE": {
      if (s.phase !== "moving") return s;
      // Validate that this move is in the current legal set.
      const legal = getLegalMoves(s.board, s.activeColor, diceToValues(s.dice));
      const matched = legal.find(
        (m) => m.from === a.move.from && m.to === a.move.to && m.die === a.move.die,
      );
      if (!matched) return s;

      const newBoard = applyMove(s.board, s.activeColor, matched);

      // Mark one die of `matched.die` as used.
      const newDice = s.dice.slice();
      const idx = newDice.findIndex((d) => !d.used && d.value === matched.die);
      if (idx >= 0) newDice[idx] = { ...newDice[idx], used: true };

      const newLastMove = {
        from: matched.from,
        to: matched.to,
        die: matched.die,
        color: s.activeColor,
        hit: matched.hit,
      };

      const winner = detectWinner(newBoard);
      const remainingValues = newDice.filter((d) => !d.used).map((d) => d.value);
      const stillHasMoves =
        remainingValues.length > 0 &&
        getLegalMoves(newBoard, s.activeColor, remainingValues).length > 0;

      const newHistory = [...s.history, snapshotForHistory(s)];

      if (winner) {
        return {
          ...s,
          board: newBoard,
          dice: newDice,
          history: newHistory,
          lastMove: newLastMove,
          pipCounts: calculatePipCounts(newBoard),
          winner,
          phase: "ended",
          message: `${winner === "white" ? "Beyaz" : "Siyah"} kazandı!`,
        };
      }

      // If no more legal moves with remaining dice, prepare to end turn.
      if (!stillHasMoves) {
        return {
          ...s,
          board: newBoard,
          dice: newDice,
          history: newHistory,
          lastMove: newLastMove,
          pipCounts: calculatePipCounts(newBoard),
          message: "Hamle hakkı kalmadı. Sırayı bitir.",
        };
      }

      return {
        ...s,
        board: newBoard,
        dice: newDice,
        history: newHistory,
        lastMove: newLastMove,
        pipCounts: calculatePipCounts(newBoard),
        message: null,
      };
    }

    // ── Undo (within current turn only) ────────────────────────────────
    case "UNDO": {
      if (s.history.length === 0) return s;
      const prev = s.history[s.history.length - 1];
      return {
        ...s,
        board: prev.board,
        dice: prev.dice,
        phase: prev.phase,
        lastMove: prev.lastMove,
        message: prev.message,
        history: s.history.slice(0, -1),
        pipCounts: calculatePipCounts(prev.board),
      };
    }

    case "END_TURN": {
      if (s.phase !== "moving" || getLegalMoves(s.board, s.activeColor, diceToValues(s.dice)).length > 0) return s;
      return {
        ...s,
        phase: "rolling",
        activeColor: oppositeColor(s.activeColor),
        dice: [],
        history: [],
        lastMove: null,
        message: null,
      };
    }

    default:
      return s;
  }
}

function oppositeColor(c: BackgammonColor): BackgammonColor {
  return c === "white" ? "black" : "white";
}

// ── Hook ───────────────────────────────────────────────────────────────
export function useBackgammon() {
  const [state, dispatch] = useReducer(reducer, undefined, createInitial);

  const legalMoves = useMemo(
    () =>
      state.phase === "moving"
        ? getLegalMoves(state.board, state.activeColor, diceToValues(state.dice))
        : [],
    [state.board, state.activeColor, state.dice, state.phase],
  );

  const actions = useMemo(
    () => ({
      restart: () => dispatch({ type: "RESTART" }),
      chooseColor: (color: BackgammonColor) => dispatch({ type: "CHOOSE_COLOR", color }),
      rollDice: () => dispatch({ type: "ROLL_DICE" }),
      playMove: (move: BackgammonMove) => dispatch({ type: "PLAY_MOVE", move }),
      undo: () => dispatch({ type: "UNDO" }),
      endTurn: () => dispatch({ type: "END_TURN" }),
    }),
    [],
  );

  // Helpers used by the UI.
  const canEndTurn = state.phase === "moving" && legalMoves.length === 0;
  const canUndo = state.phase === "moving" && state.history.length > 0;

  const movesFromSource = useCallback(
    (src: number | "bar") => legalMoves.filter((m) => m.from === src),
    [legalMoves],
  );

  return {
    state,
    legalMoves,
    actions,
    canEndTurn,
    canUndo,
    movesFromSource,
  };
}
