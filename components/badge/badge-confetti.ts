import confetti from "canvas-confetti"
import { rarityConfig } from "./badge-config"

export function triggerBadgeConfetti(badgeColor: string, badgeRarity: string): void {
  const rarity = rarityConfig[badgeRarity] || rarityConfig.common
  const particleCount = rarity.particles

  // Initial big burst from center
  confetti({
    particleCount,
    spread: 100,
    origin: { y: 0.5, x: 0.5 },
    colors: [badgeColor, "#FFD700", "#FFA500", "#FF69B4", "#00CED1", "#7C3AED"],
    startVelocity: 45,
    gravity: 0.8,
    scalar: 1.2,
  })

  // Delayed side bursts
  setTimeout(() => {
    confetti({
      particleCount: particleCount / 2,
      angle: 60,
      spread: 70,
      origin: { x: 0, y: 0.5 },
      colors: [badgeColor, "#FFD700", "#FF69B4"],
      startVelocity: 50,
    })
    confetti({
      particleCount: particleCount / 2,
      angle: 120,
      spread: 70,
      origin: { x: 1, y: 0.5 },
      colors: [badgeColor, "#FFD700", "#00CED1"],
      startVelocity: 50,
    })
  }, 150)

  // Top burst for rare+
  if (["rare", "epic", "legendary"].includes(badgeRarity)) {
    setTimeout(() => {
      confetti({
        particleCount: particleCount / 3,
        angle: 270,
        spread: 80,
        origin: { x: 0.5, y: 0 },
        colors: [badgeColor, "#FFD700"],
        startVelocity: 35,
        gravity: 1.2,
      })
    }, 300)
  }

  // Extra sparkle shower for epic+
  if (["epic", "legendary"].includes(badgeRarity)) {
    const sparkleInterval = setInterval(() => {
      confetti({
        particleCount: 15,
        spread: 360,
        startVelocity: 15,
        decay: 0.92,
        origin: { x: Math.random(), y: Math.random() * 0.4 },
        colors: ["#FFD700", "#FFA500", badgeColor],
        shapes: ["star"],
        scalar: 0.8,
      })
    }, 200)
    setTimeout(() => clearInterval(sparkleInterval), 2500)
  }

  // Legendary gets continuous golden rain
  if (badgeRarity === "legendary") {
    const goldRainInterval = setInterval(() => {
      confetti({
        particleCount: 8,
        spread: 120,
        startVelocity: 25,
        decay: 0.94,
        origin: { x: 0.2 + Math.random() * 0.6, y: -0.1 },
        colors: ["#FFD700", "#FFA500", "#FFEC8B"],
        gravity: 1.5,
        scalar: 1.1,
      })
    }, 150)
    setTimeout(() => clearInterval(goldRainInterval), 3500)
  }
}
