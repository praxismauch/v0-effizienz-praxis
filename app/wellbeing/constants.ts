import {
  Users,
  Lightbulb,
  HandHeart,
  Heart,
  Shield,
  Sparkles,
  Target,
  TrendingUp,
  Coffee,
  Brain,
  MessageSquare,
  Award,
  Clock,
  Activity,
} from "lucide-react"

export const KUDOS_CATEGORIES = [
  { value: "teamwork", label: "Teamarbeit", icon: Users, color: "bg-blue-500" },
  { value: "innovation", label: "Innovation", icon: Lightbulb, color: "bg-purple-500" },
  { value: "helpfulness", label: "Hilfsbereitschaft", icon: HandHeart, color: "bg-pink-500" },
  { value: "customer_service", label: "Patientenservice", icon: Heart, color: "bg-red-500" },
  { value: "reliability", label: "Zuverlässigkeit", icon: Shield, color: "bg-green-500" },
  { value: "positivity", label: "Positive Energie", icon: Sparkles, color: "bg-yellow-500" },
  { value: "leadership", label: "Führung", icon: Target, color: "bg-indigo-500" },
  { value: "growth", label: "Weiterentwicklung", icon: TrendingUp, color: "bg-teal-500" },
]

export const SUGGESTION_CATEGORIES = [
  { value: "work_life_balance", label: "Work-Life-Balance", icon: Coffee },
  { value: "stress_reduction", label: "Stressreduktion", icon: Brain },
  { value: "team_building", label: "Teambuilding", icon: Users },
  { value: "communication", label: "Kommunikation", icon: MessageSquare },
  { value: "recognition", label: "Anerkennung", icon: Award },
  { value: "flexibility", label: "Flexibilität", icon: Clock },
  { value: "health", label: "Gesundheit", icon: Activity },
  { value: "growth", label: "Entwicklung", icon: TrendingUp },
]
