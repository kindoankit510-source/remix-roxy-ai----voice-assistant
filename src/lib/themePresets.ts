import { ThemePreset, ThemeConfig } from "../types";

export const THEME_CONFIGS: Record<ThemePreset, ThemeConfig> = {
  "neon-pink": {
    id: "neon-pink",
    name: "Geometric Crimson",
    primary: "#FF2E63",
    glowColor: "rgba(255, 46, 99, 0.4)",
    gradient: "from-rose-600 via-pink-600 to-red-500",
    bgRadial: "radial-gradient(circle at center, rgba(255,46,99,0.15) 0%, rgba(10,10,10,0.98) 70%, #050505 100%)",
  },
  "cyber-purple": {
    id: "cyber-purple",
    name: "Cyber Violet",
    primary: "#a855f7",
    glowColor: "rgba(168, 85, 247, 0.5)",
    gradient: "from-purple-500 via-indigo-500 to-pink-500",
    bgRadial: "radial-gradient(circle at center, rgba(168,85,247,0.15) 0%, rgba(10,10,10,0.98) 70%, #050505 100%)",
  },
  "electric-cyan": {
    id: "electric-cyan",
    name: "Electric Azure",
    primary: "#00f0ff",
    glowColor: "rgba(0, 240, 255, 0.5)",
    gradient: "from-cyan-400 via-sky-500 to-blue-600",
    bgRadial: "radial-gradient(circle at center, rgba(0,240,255,0.15) 0%, rgba(10,10,10,0.98) 70%, #050505 100%)",
  },
  "crimson-fire": {
    id: "crimson-fire",
    name: "Crimson Flame",
    primary: "#ff3b30",
    glowColor: "rgba(255, 59, 48, 0.5)",
    gradient: "from-red-500 via-rose-600 to-orange-500",
    bgRadial: "radial-gradient(circle at center, rgba(255,59,48,0.15) 0%, rgba(10,10,10,0.98) 70%, #050505 100%)",
  },
  "emerald-glow": {
    id: "emerald-glow",
    name: "Emerald Matrix",
    primary: "#00FF88",
    glowColor: "rgba(0, 255, 136, 0.5)",
    gradient: "from-emerald-400 via-teal-500 to-green-600",
    bgRadial: "radial-gradient(circle at center, rgba(0,255,136,0.15) 0%, rgba(10,10,10,0.98) 70%, #050505 100%)",
  },
  "gold-amber": {
    id: "gold-amber",
    name: "Golden Champagne",
    primary: "#f59e0b",
    glowColor: "rgba(245, 158, 11, 0.5)",
    gradient: "from-amber-400 via-yellow-500 to-orange-500",
    bgRadial: "radial-gradient(circle at center, rgba(245,158,11,0.15) 0%, rgba(10,10,10,0.98) 70%, #050505 100%)",
  },
};
