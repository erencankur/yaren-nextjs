"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SolitaireGame } from "../engine/SolitaireGame";

/**
 * React hook wrapping a long-lived `SolitaireGame` instance.
 * Exposes a serialized snapshot for rendering and a stable game ref
 * for issuing commands. After every command the snapshot is refreshed.
 */
export function useSolitaire() {
  const gameRef = useRef<SolitaireGame | null>(null);
  if (gameRef.current === null) gameRef.current = new SolitaireGame();
  const game = gameRef.current;

  const [snapshot, setSnapshot] = useState(() => game.serialize());

  const refresh = useCallback(() => {
    setSnapshot(game.serialize());
  }, [game]);

  // Auto-complete loop.
  useEffect(() => {
    if (snapshot.state !== "auto-completing") return;
    const id = window.setInterval(() => {
      const moved = game.autoCompleteStep();
      refresh();
      if (!moved) window.clearInterval(id);
    }, 120);
    return () => window.clearInterval(id);
  }, [snapshot.state, game, refresh]);

  const actions = useMemo(
    () => ({
      clickStock: () => {
        game.clickStock();
        refresh();
      },
      undo: () => {
        game.undo();
        refresh();
      },
      restart: () => {
        game.restart();
        refresh();
      },
      setDrawMode: (m: 1 | 3) => {
        game.setDrawMode(m);
        refresh();
      },
      tryAutoFoundation: (cardId: number) => {
        const card = game.card(cardId);
        if (!card) return false;
        const pile = game.findPileOf(card);
        if (!pile) return false;
        const ok = game.tryAutoFoundation(card, pile);
        if (ok) refresh();
        return ok;
      },
      tryMove: (
        cardIds: number[],
        targetKind: "tableau" | "foundation",
        targetIndex: number,
      ) => {
        if (cardIds.length === 0) return false;
        const lead = game.card(cardIds[0]);
        if (!lead) return false;
        const source = game.findPileOf(lead);
        if (!source) return false;
        const sourceIndex = source.cards.indexOf(lead);
        const target =
          targetKind === "tableau"
            ? game.tableaux[targetIndex]
            : game.foundations[targetIndex];
        const ok = game.tryMove(source, sourceIndex, target);
        if (ok) refresh();
        return ok;
      },
    }),
    [game, refresh],
  );

  return { snapshot, actions, game };
}
