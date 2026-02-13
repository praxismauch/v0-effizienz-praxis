export interface CompetitorAnalysis {
  id: string
  practice_id: string
  created_by: string
  location: string
  specialty: string
  radius_km: number
  additional_keywords: string[]
  title: string
  name: string
  status: string
  summary: string
  market_overview: MarketOverview | null
  competitors: Competitor[]
  strengths_weaknesses: StrengthsWeaknesses | null
  opportunities: Opportunity[]
  threats: Threat[]
  recommendations: Recommendation[]
  pricing_comparison: PricingComparison | null
  service_comparison: ServiceComparison | null
  online_presence: OnlinePresence | null
  patient_reviews_analysis: PatientReviewsAnalysis | null
  ai_analysis: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

export interface MarketOverview {
  total_competitors?: number
  market_saturation?: string
  key_insights?: string[]
}

export interface Competitor {
  name: string
  address?: string
  rating?: number
  review_count?: number
  specialties?: string[]
  strengths?: string[]
  website?: string
}

export interface StrengthsWeaknesses {
  market_strengths?: string[]
  market_weaknesses?: string[]
}

export interface Opportunity {
  title: string
  description: string
  priority?: string
  implementation_effort?: string
}

export interface Threat {
  title: string
  description: string
  severity?: string
  mitigation?: string
}

export interface Recommendation {
  title: string
  description: string
  category?: string
  priority?: string
  expected_impact?: string
  implementation_steps?: string[]
  estimated_cost?: string
}

export interface PricingComparison {
  average_consultation_fee?: string
  price_positioning?: string
}

export interface ServiceComparison {
  services?: string[]
}

export interface OnlinePresence {
  website_quality?: {
    average_score?: number
    key_findings?: string[]
  }
  social_media_presence?: string
}

export interface PatientReviewsAnalysis {
  average_rating?: number
  total_reviews?: number
  common_praise?: string[]
  common_complaints?: string[]
}

export function getPriorityColor(priority: string): string {
  switch (priority?.toLowerCase()) {
    case "hoch":
    case "high":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
    case "mittel":
    case "medium":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
    case "niedrig":
    case "low":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
  }
}
