import type React from "react"
import {
  Award,
  Rocket,
  BookOpen,
  GraduationCap,
  Flame,
  Crown,
  Target,
  Sunrise,
  Moon,
  Users,
  MessageCircle,
  Star,
  Sparkles,
  Zap,
  Trophy,
  Medal,
  Heart,
  Gem,
} from "lucide-react"

export interface BadgeData {
  id: string
  name: string
  description: string
  icon_name: string
  color: string
  rarity: string
  points: number
}

export interface RarityConfig {
  label: string
  gradient: string
  glow: string
  particles: number
  ringCount: number
  pulseIntensity: number
  shakeIntensity: number
}

export const iconMap: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  award: Award,
  rocket: Rocket,
  "book-open": BookOpen,
  "graduation-cap": GraduationCap,
  flame: Flame,
  crown: Crown,
  target: Target,
  sunrise: Sunrise,
  moon: Moon,
  users: Users,
  "message-circle": MessageCircle,
  star: Star,
  zap: Zap,
  trophy: Trophy,
  medal: Medal,
  heart: Heart,
  gem: Gem,
  sparkles: Sparkles,
}

export const rarityConfig: Record<string, RarityConfig> = {
  common: {
    label: "Gewoehnlich",
    gradient: "from-slate-400 via-gray-500 to-slate-600",
    glow: "shadow-slate-400/60",
    particles: 50,
    ringCount: 1,
    pulseIntensity: 1.05,
    shakeIntensity: 0,
  },
  uncommon: {
    label: "Ungewoehnlich",
    gradient: "from-emerald-400 via-green-500 to-teal-600",
    glow: "shadow-emerald-400/60",
    particles: 80,
    ringCount: 2,
    pulseIntensity: 1.1,
    shakeIntensity: 2,
  },
  rare: {
    label: "Selten",
    gradient: "from-blue-400 via-indigo-500 to-purple-600",
    glow: "shadow-blue-400/70",
    particles: 120,
    ringCount: 3,
    pulseIntensity: 1.15,
    shakeIntensity: 3,
  },
  epic: {
    label: "Episch",
    gradient: "from-violet-400 via-purple-500 to-fuchsia-600",
    glow: "shadow-purple-500/80",
    particles: 180,
    ringCount: 4,
    pulseIntensity: 1.2,
    shakeIntensity: 5,
  },
  legendary: {
    label: "Legendaer",
    gradient: "from-amber-400 via-orange-500 to-red-500",
    glow: "shadow-amber-500/90",
    particles: 300,
    ringCount: 5,
    pulseIntensity: 1.25,
    shakeIntensity: 8,
  },
}
