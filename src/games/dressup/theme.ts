export const DRESSUP_THEMES = [
  { id: "dark-purple", label: "Koyu mor", color: "#d8b5f5" },
  { id: "dark-green", label: "Koyu yeşil", color: "#b9ecd4" },
  { id: "light-purple", label: "Açık mor", color: "#4e2769" },
  { id: "light-green", label: "Açık yeşil", color: "#265e49" },
] as const;

export type DressupTheme = (typeof DRESSUP_THEMES)[number]["id"];
