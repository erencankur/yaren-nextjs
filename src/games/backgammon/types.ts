// Backgammon shared types — pure data, no React.
//
// Convention:
//   index 0  = White's 1-point   (White's home is 0..5)
//   index 23 = White's 24-point  (Black's home is 18..23)
//   White moves from high indexes to low indexes  (dest = src - die).
//   Black moves from low indexes to high indexes  (dest = src + die).

export type BackgammonColor = "white" | "black";

export type BackgammonPhase =
  | "choosing"
  | "rolling"
  | "moving"
  | "ended";

export type MoveSource = number | "bar";
export type MoveTarget = number | "off";

export interface PointState {
  owner: BackgammonColor | null;
  count: number;
}

export interface BoardState {
  /** 24 points indexed 0..23. */
  points: PointState[];
  bar: Record<BackgammonColor, number>;
  borneOff: Record<BackgammonColor, number>;
}

export interface DieState {
  id: string;
  value: number;
  used: boolean;
}

export interface BackgammonMove {
  from: MoveSource;
  to: MoveTarget;
  die: number;
}

export interface BackgammonLegalMove extends BackgammonMove {
  hit: boolean;
  bearsOff: boolean;
}

export interface LastMove {
  from: MoveSource;
  to: MoveTarget;
  die: number;
  color: BackgammonColor;
  hit: boolean;
}

export interface HistoryEntry {
  board: BoardState;
  dice: DieState[];
  phase: BackgammonPhase;
  lastMove: LastMove | null;
  message: string | null;
}

export interface LocalBackgammonState {
  phase: BackgammonPhase;
  board: BoardState;
  activeColor: BackgammonColor;
  /** Two or four dice (four when doubles). */
  dice: DieState[];
  yarenColor: BackgammonColor | null;
  pipCounts: Record<BackgammonColor, number>;
  history: HistoryEntry[];
  lastMove: LastMove | null;
  winner: BackgammonColor | null;
  message: string | null;
}
