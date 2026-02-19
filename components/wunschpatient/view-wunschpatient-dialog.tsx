"use client"

import { Dialog, DialogContent } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
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

export interface WunschpatientProfile {
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

interface ViewWunschpatientDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  profile: WunschpatientProfile
}

export function ViewWunschpatientDialog({ open, onOpenChange, profile }: ViewWunschpatientDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[95vh] p-0 overflow-hidden">
        <ProfileHeader profile={profile} onClose={() => onOpenChange(false)} />

        <ScrollArea className="max-h-[calc(95vh-180px)]">
          <div className="px-8 pt-20 pb-8 space-y-6">
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
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
