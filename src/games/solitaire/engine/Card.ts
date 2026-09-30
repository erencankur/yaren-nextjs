/**
 * Card model. Pure data — no DOM, no React.
 * Ported from `two-of-hearts/src/entities/card.py`.
 */
import { RED_SUITS, type Suit, VALUE_NAMES } from "./constants";

let __cardId = 0;

export class Card {
  /** Stable id for React keys & React-friendly diffing. */
  readonly id: number;
  readonly suit: Suit;
  /** 1 (Ace) … 13 (King). */
  readonly value: number;
  isFaceUp: boolean;

  constructor(suit: Suit, value: number, faceUp = false) {
    this.id = ++__cardId;
    this.suit = suit;
    this.value = value;
    this.isFaceUp = faceUp;
  }

  get isRed(): boolean {
    return RED_SUITS.has(this.suit);
  }

  get displayName(): string {
    return `${VALUE_NAMES[this.value]} of ${this.suit}`;
  }

  /** The artwork format used by the board: original PNG for J/Q/K, WebP otherwise. */
  get faceImage(): string {
    const n = String(this.value).padStart(2, "0");
    return `/cards/${this.suit.toLowerCase()}/${this.suit.toLowerCase()}_card_${n}.${this.value >= 11 ? "png" : "webp"}`;
  }

  static get backImage(): string {
    return "/cards/back.png";
  }
}
