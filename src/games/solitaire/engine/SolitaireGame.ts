/**
 * SolitaireGame — top-level controller.
 * Ported from `two-of-hearts/src/main.py` (Game class), trimmed to the
 * pure logic relevant for a web UI. Rendering, audio and animation are
 * handled by the React layer.
 */

import { Card } from "./Card";
import {
  type DrawMode,
  type GameState,
  NUM_TABLEAU_COLUMNS,
  SCORE_PER_FOUNDATION,
  SUITS,
} from "./constants";
import {
  FoundationPile,
  type Pile,
  StockPile,
  TableauPile,
  WastePile,
} from "./piles";

interface Snapshot {
  score: number;
  stock: { id: number; faceUp: boolean }[];
  waste: { id: number; faceUp: boolean }[];
  foundations: { id: number; faceUp: boolean }[][];
  tableaux: { id: number; faceUp: boolean }[][];
}

export class SolitaireGame {
  state: GameState = "dealing";
  drawMode: DrawMode = 3;
  score = 0;
  startTimeMs = 0;

  stock = new StockPile();
  waste = new WastePile();
  foundations: FoundationPile[] = Array.from({ length: 4 }, () => new FoundationPile());
  tableaux: TableauPile[] = Array.from(
    { length: NUM_TABLEAU_COLUMNS },
    () => new TableauPile(),
  );

  /** All 52 cards (stable list — referenced by id between snapshots). */
  private readonly allCards: Card[] = [];
  private readonly cardById = new Map<number, Card>();

  /** Undo history. */
  private readonly undoStack: Snapshot[] = [];

  constructor() {
    this.waste.drawMode = this.drawMode;
    this.createDeck();
    this.deal();
  }

  // ── Deck / dealing ──────────────────────────────────────

  private createDeck(): void {
    for (const suit of SUITS) {
      for (let v = 1; v <= 13; v++) {
        const card = new Card(suit, v);
        this.allCards.push(card);
        this.cardById.set(card.id, card);
      }
    }
    this.shuffle(this.allCards);
    for (const c of this.allCards) {
      c.isFaceUp = false;
      this.stock.addCard(c);
    }
  }

  private shuffle<T>(arr: T[]): void {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }

  private deal(): void {
    // Standard Klondike deal: column c gets c+1 cards, top card face-up.
    for (let col = 0; col < NUM_TABLEAU_COLUMNS; col++) {
      for (let row = 0; row <= col; row++) {
        const card = this.stock.removeTopCard();
        if (!card) break;
        card.isFaceUp = row === col;
        this.tableaux[col].addCard(card);
      }
    }
    this.startTimeMs = Date.now();
    this.state = "playing";
  }

  // ── Public actions ──────────────────────────────────────

  clickStock(): void {
    if (this.state !== "playing") return;
    this.saveUndo();
    if (!this.stock.isEmpty) {
      const n = Math.min(this.drawMode, this.stock.cards.length);
      for (let i = 0; i < n; i++) {
        const c = this.stock.removeTopCard();
        if (!c) break;
        c.isFaceUp = true;
        this.waste.addCard(c);
      }
    } else {
      // Recycle waste back into stock face-down (preserve order).
      while (!this.waste.isEmpty) {
        const c = this.waste.removeTopCard()!;
        c.isFaceUp = false;
        this.stock.addCard(c);
      }
    }
  }

  /**
   * Try to move the cards starting at `sourceIndex` of `source` onto `target`.
   * Returns true on success.
   */
  tryMove(source: Pile, sourceIndex: number, target: Pile): boolean {
    if (sourceIndex < 0 || sourceIndex >= source.cards.length) return false;
    const lead = source.cards[sourceIndex];
    if (!lead.isFaceUp) return false;
    const moveCount = source.cards.length - sourceIndex;
    if (target instanceof FoundationPile && moveCount !== 1) return false;
    if (!target.canAcceptCard(lead)) return false;

    this.saveUndo();
    const moving = source.removeCardsFrom(sourceIndex);
    target.addCards(moving);
    if (source instanceof TableauPile) source.autoFlipTop();
    if (target instanceof FoundationPile) this.score += SCORE_PER_FOUNDATION;
    this.checkWin();
    return true;
  }

  /** Double-click handler: try to send the card to any matching foundation. */
  tryAutoFoundation(card: Card, source: Pile): boolean {
    if (this.state !== "playing") return false;
    if (source instanceof TableauPile) {
      if (source.cardIndex(card) !== source.cards.length - 1) return false;
    } else if (source.topCard !== card) {
      return false;
    }
    for (const f of this.foundations) {
      if (f.canAcceptCard(card)) {
        this.saveUndo();
        source.removeTopCard();
        if (source instanceof TableauPile) source.autoFlipTop();
        card.isFaceUp = true;
        f.addCard(card);
        this.score += SCORE_PER_FOUNDATION;
        this.checkWin();
        return true;
      }
    }
    return false;
  }

  setDrawMode(mode: DrawMode): void {
    this.drawMode = mode;
    this.waste.drawMode = mode;
    this.restart();
  }

  restart(): void {
    this.score = 0;
    this.undoStack.length = 0;
    for (const p of this.allPiles) p.cards.length = 0;
    this.shuffle(this.allCards);
    for (const c of this.allCards) {
      c.isFaceUp = false;
      this.stock.addCard(c);
    }
    this.state = "dealing";
    this.deal();
  }

  undo(): boolean {
    if (this.state !== "playing" || !this.undoStack.length) return false;
    const snap = this.undoStack.pop()!;
    this.score = snap.score;
    for (const p of this.allPiles) p.cards.length = 0;
    this.restorePile(this.stock, snap.stock);
    this.restorePile(this.waste, snap.waste);
    snap.foundations.forEach((s, i) => this.restorePile(this.foundations[i], s));
    snap.tableaux.forEach((s, i) => this.restorePile(this.tableaux[i], s));
    return true;
  }

  // ── Auto-complete ───────────────────────────────────────

  canAutoComplete(): boolean {
    if (!this.stock.isEmpty || !this.waste.isEmpty) return false;
    return this.tableaux.every((t) => t.cards.every((c) => c.isFaceUp));
  }

  /** Move one card to a foundation if possible. Returns true if it did. */
  autoCompleteStep(): boolean {
    for (const t of this.tableaux) {
      if (t.isEmpty) continue;
      const card = t.topCard!;
      for (const f of this.foundations) {
        if (f.canAcceptCard(card)) {
          t.removeTopCard();
          card.isFaceUp = true;
          f.addCard(card);
          this.score += SCORE_PER_FOUNDATION;
          this.checkWin();
          return true;
        }
      }
    }
    return false;
  }

  // ── Internals ───────────────────────────────────────────

  private get allPiles(): Pile[] {
    return [this.stock, this.waste, ...this.foundations, ...this.tableaux];
  }

  private checkWin(): void {
    if (this.foundations.every((f) => f.cards.length === 13)) {
      this.state = "won";
    } else if (this.canAutoComplete()) {
      this.state = "auto-completing";
    }
  }

  private saveUndo(): void {
    const cap = (cs: Card[]) => cs.map((c) => ({ id: c.id, faceUp: c.isFaceUp }));
    this.undoStack.push({
      score: this.score,
      stock: cap(this.stock.cards),
      waste: cap(this.waste.cards),
      foundations: this.foundations.map((f) => cap(f.cards)),
      tableaux: this.tableaux.map((t) => cap(t.cards)),
    });
    if (this.undoStack.length > 100) this.undoStack.shift();
  }

  private restorePile(pile: Pile, snap: { id: number; faceUp: boolean }[]): void {
    for (const { id, faceUp } of snap) {
      const card = this.cardById.get(id)!;
      card.isFaceUp = faceUp;
      pile.addCard(card);
    }
  }

  // ── Serialization for React ─────────────────────────────

  serialize() {
    const cap = (cs: Card[]) => cs.map((c) => ({ id: c.id, suit: c.suit, value: c.value, faceUp: c.isFaceUp }));
    return {
      state: this.state,
      drawMode: this.drawMode,
      score: this.score,
      startTimeMs: this.startTimeMs,
      stock: cap(this.stock.cards),
      waste: cap(this.waste.cards),
      foundations: this.foundations.map((f) => cap(f.cards)),
      tableaux: this.tableaux.map((t) => cap(t.cards)),
      canUndo: this.undoStack.length > 0,
    };
  }

  /**
   * Lookup a card by id. Used by the UI to translate click targets back
   * into engine objects.
   */
  card(id: number): Card | undefined {
    return this.cardById.get(id);
  }

  /** Find the pile that currently owns the given card (or null). */
  findPileOf(card: Card): Pile | null {
    for (const p of this.allPiles) {
      if (p.cards.includes(card)) return p;
    }
    return null;
  }
}
