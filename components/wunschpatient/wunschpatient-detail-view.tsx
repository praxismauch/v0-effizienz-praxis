"use client"

import { ProfileHeader } from "./profile-header"
import {
  QuickStats,
  PersonaDescription,
  HealthLifestyleCard,
  ValuesExpectationsCard,
  MarketingStrategyCard,
  CommunicationTipsCard,
  ServiceRecommendationsCard,
  ServicesInterestedCard,
} from "./profile-sections"

interface WunschpatientProfile {
  id: string
  name: string
  age_range: string
  gender: string
  occupation: string
  family_status: string
  archetype: string
  health_concerns: string[]
  lifestyle_factors: string[]
  values: string[]
  expectations: string[]
  health_consciousness: string
  prevention_vs_acute: string
  communication_preference: string
  financial_willingness: string
  location_area: string
  transport_method: string
  services_interested: string[]
  persona_description: string
  marketing_strategy: string
  communication_tips: string
  service_recommendations: string[]
  ai_generated_image_url: string
  is_active: boolean
  created_at: string
}

interface WunschpatientDetailViewProps {
  profile: WunschpatientProfile
  onBack: () => void
}

export function WunschpatientDetailView({ profile, onBack }: WunschpatientDetailViewProps) {
  return (
    <div className="space-y-6">
      <div className="rounded-xl overflow-hidden border shadow-sm">
        <ProfileHeader profile={profile} onBack={onBack} />

        <div className="px-6 md:px-8 pt-20 pb-8 space-y-6 bg-background">
          <QuickStats profile={profile} />

          {profile.persona_description && (
            <PersonaDescription description={profile.persona_description} />
          )}

          <div className="grid md:grid-cols-2 gap-6">
            <HealthLifestyleCard profile={profile} />
            <ValuesExpectationsCard profile={profile} />
          </div>

          <div className="space-y-6">
            {profile.marketing_strategy && (
              <MarketingStrategyCard strategy={profile.marketing_strategy} />
            )}
            {profile.communication_tips && (
              <CommunicationTipsCard tips={profile.communication_tips} />
            )}
          </div>

          <ServiceRecommendationsCard services={profile.service_recommendations} />
          <ServicesInterestedCard services={profile.services_interested} />
        </div>
      </div>
    </div>
  )
}
