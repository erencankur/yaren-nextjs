/**
 * Pile hierarchy for Klondike Solitaire.
 * Ported from `two-of-hearts/src/entities/piles.py`.
 *
 * Each pile owns a list of `Card`s and the rules for accepting new ones.
 * Layout positions are computed by callers (the renderer) using
 * `getCardOffset(index)`, which returns a delta from the pile origin.
 */

import type { Card } from "./Card";
import {
  TABLEAU_FACE_DOWN_OFFSET,
  TABLEAU_FACE_UP_OFFSET,
  WASTE_FAN_OFFSET_X,
} from "./constants";

export type PileKind = "stock" | "waste" | "foundation" | "tableau";

export abstract class Pile {
  abstract readonly kind: PileKind;
  cards: Card[] = [];

  addCard(card: Card): void {
    this.cards.push(card);
  }

  addCards(cards: Card[]): void {
    this.cards.push(...cards);
  }

  removeTopCard(): Card | null {
    return this.cards.pop() ?? null;
  }

  removeCardsFrom(index: number): Card[] {
    return this.cards.splice(index);
  }

  get topCard(): Card | null {
    return this.cards.length ? this.cards[this.cards.length - 1] : null;
  }

  get isEmpty(): boolean {
    return this.cards.length === 0;
  }

  cardIndex(card: Card): number {
    return this.cards.indexOf(card);
  }

  /** Returns the (dx, dy) offset from the pile origin for the card at `index`. */
  getCardOffset(_index: number): { dx: number; dy: number } {
    return { dx: 0, dy: 0 };
  }

  canAcceptCard(_card: Card): boolean {
    return false;
  }
}

export class StockPile extends Pile {
  readonly kind = "stock" as const;
}

export class WastePile extends Pile {
  readonly kind = "waste" as const;
  drawMode: 1 | 3 = 1;

  override getCardOffset(index: number): { dx: number; dy: number } {
    if (this.drawMode === 3 && this.cards.length > 1) {
      const fanStart = Math.max(0, this.cards.length - 3);
      if (index >= fanStart) {
        return { dx: (index - fanStart) * WASTE_FAN_OFFSET_X, dy: 0 };
      }
    }
    return { dx: 0, dy: 0 };
  }
}

export class FoundationPile extends Pile {
  readonly kind = "foundation" as const;

  override canAcceptCard(card: Card): boolean {
    if (this.isEmpty) return card.value === 1;
    const top = this.topCard!;
    return card.suit === top.suit && card.value === top.value + 1;
  }
}

export class TableauPile extends Pile {
  readonly kind = "tableau" as const;

  override getCardOffset(index: number): { dx: number; dy: number } {
    let dy = 0;
    for (let i = 0; i < index; i++) {
      dy += this.cards[i].isFaceUp
        ? TABLEAU_FACE_UP_OFFSET
        : TABLEAU_FACE_DOWN_OFFSET;
    }
    return { dx: 0, dy };
  }

  override canAcceptCard(card: Card): boolean {
    if (this.isEmpty) return card.value === 13;
    const top = this.topCard!;
    return card.value === top.value - 1 && card.isRed !== top.isRed;
  }

  /** Flip the top card face-up if currently face-down (after a move). */
  autoFlipTop(): void {
    const top = this.topCard;
    if (top && !top.isFaceUp) top.isFaceUp = true;
  }
}
