import { fire, firework } from "react-rewards";
import confetti from "canvas-confetti";

export function celebrateSubmission() {
  if (
    typeof window === "undefined" ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  )
    return;
  const colors = ["#ff4757", "#ffd93d", "#00e5ff", "#a855f7", "#4ade80", "#ff8ad8"];
  const base = { colors, zIndex: 9999, disableForReducedMotion: true, ticks: 140 };
  void confetti({
    ...base,
    particleCount: 120,
    spread: 120,
    startVelocity: 60,
    origin: { x: 0.5, y: 0.8 },
  });
  const end = performance.now() + 2600;
  const burst = () => {
    void confetti({
      ...base,
      particleCount: 85,
      angle: 60,
      spread: 80,
      startVelocity: 55,
      origin: { x: 0, y: 0.8 },
    });
    void confetti({
      ...base,
      particleCount: 85,
      angle: 120,
      spread: 80,
      startVelocity: 55,
      origin: { x: 1, y: 0.8 },
    });
    void confetti({
      ...base,
      particleCount: 75,
      spread: 360,
      startVelocity: 35,
      origin: { x: 0.2 + Math.random() * 0.6, y: 0.15 + Math.random() * 0.3 },
    });
    if (performance.now() < end) window.setTimeout(burst, 450);
  };
  burst();
}

export function celebrateHistory() {
  if (typeof window === "undefined") return;
  const { innerWidth: w, innerHeight: h } = window;
  const corners = [
    { x: 0, y: 0, angle: -45 },
    { x: w, y: 0, angle: -135 },
    { x: 0, y: h, angle: 45 },
    { x: w, y: h, angle: 135 },
  ];
  for (const { x, y, angle } of corners) {
    fire(firework, {
      origin: { x, y },
      config: {
        count: 12,
        size: 11,
        velocity: 850,
        angle,
        spread: 55,
        stars: 85,
        radius: 125,
        colors: ["#ff4757", "#ffd93d", "#00e5ff", "#a855f7", "#4ade80", "#ff8ad8", "#ffffff"],
      },
      respectReducedMotion: true,
    });
  }
}
