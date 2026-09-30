/**
 * Shared constants for the Klondike Solitaire engine.
 * Ported from `two-of-hearts/src/constants.py`.
 */

// Reference design size — all px values in the UI scale relative to this.
export const REF_BOARD_WIDTH = 720;
export const REF_BOARD_HEIGHT = 900;

// Card dimensions (in reference px). The board scales them with CSS.
export const CARD_WIDTH = 90;
export const CARD_HEIGHT = 130;

// Tableau cascade offsets.
export const TABLEAU_FACE_DOWN_OFFSET = 10;
export const TABLEAU_FACE_UP_OFFSET = 28;

// Waste pile fan offset (Draw 3 mode).
export const WASTE_FAN_OFFSET_X = 26;

export const NUM_TABLEAU_COLUMNS = 7;

// Double-click detection window.
export const DOUBLE_CLICK_MS = 300;

// Score per move to a foundation pile.
export const SCORE_PER_FOUNDATION = 10;

export const SUITS = ["Hearts", "Diamonds", "Clubs", "Spades"] as const;
export type Suit = (typeof SUITS)[number];

export const VALUE_NAMES: Record<number, string> = {
  1: "A",
  2: "2",
  3: "3",
  4: "4",
  5: "5",
  6: "6",
  7: "7",
  8: "8",
  9: "9",
  10: "10",
  11: "J",
  12: "Q",
  13: "K",
};

export const RED_SUITS: ReadonlySet<Suit> = new Set<Suit>(["Hearts", "Diamonds"]);

export type GameState =
  | "dealing"
  | "playing"
  | "auto-completing"
  | "won";

export type DrawMode = 1 | 3;
