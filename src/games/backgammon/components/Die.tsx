"use client";

// Pure CSS pixel-art die. No image dependency.
const PIPS: Record<number, [number, number][]> = {
  1: [[1, 1]],
  2: [[0, 0], [2, 2]],
  3: [[0, 0], [1, 1], [2, 2]],
  4: [[0, 0], [2, 0], [0, 2], [2, 2]],
  5: [[0, 0], [2, 0], [1, 1], [0, 2], [2, 2]],
  6: [[0, 0], [2, 0], [0, 1], [2, 1], [0, 2], [2, 2]],
};

export default function Die({ value, used }: { value: number; used: boolean }) {
  const pips = PIPS[value] ?? [];
  return (
    <div
      className={`die ${used ? "die-used" : ""}`}
      role="img"
      aria-label={`Die showing ${value}${used ? " (used)" : ""}`}
    >
      <div className="die-face">
        {pips.map(([col, row], i) => (
          <span
            key={i}
            className="die-pip"
            style={{ gridColumn: col + 1, gridRow: row + 1 }}
          />
        ))}
      </div>
    </div>
  );
}
