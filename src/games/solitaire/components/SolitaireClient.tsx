"use client";

import { useEffect, useState } from "react";
import Board from "./Board";

// The deck is shuffled with Math.random, so create it after hydration.
export default function SolitaireClient() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted ? <Board /> : <div className="min-h-[100dvh] bg-black" />;
}
