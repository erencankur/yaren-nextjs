"use client";

import { useEffect, useReducer } from "react";
import { audio } from "./audio";

/** Re-render when audio state changes (current track / play state / mute). */
export function useAudio() {
  const [, force] = useReducer((x: number) => x + 1, 0);
  useEffect(() => audio.subscribe(force), []);
  return audio;
}
