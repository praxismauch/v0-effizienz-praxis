"use client"

import { LandingPageFooter } from "@/components/landing-page-footer"
import { LandingPageChatbot } from "@/components/landing-page-chatbot"
import { LandingAIQuestionBox } from "@/components/landing-ai-question-box"
import {
  LandingHeader,
  HeroSection,
  EfficiencyValueSection,
  FeaturesSection,
  BenefitsSection,
  EfficiencyCheckSection,
  UseCasesSection,
  AcademySection,
  CTASection,
} from "@/components/landing/sections"

export default function LandingPageClient() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Header */}
      <LandingHeader />

      {/* Hero Section */}
      <HeroSection />

      {/* Efficiency Value Proposition Section */}
      <EfficiencyValueSection />

      {/* Features Section */}
      <FeaturesSection />

      {/* Benefits Section */}
      <BenefitsSection />

      {/* Effizienz-Check Section */}
      <EfficiencyCheckSection />

      {/* Use Cases Section */}
      <UseCasesSection />

      {/* AI Question Box */}
      <LandingAIQuestionBox />

      {/* Academy Coming Soon Section */}
      <AcademySection />

      {/* CTA Section */}
      <CTASection />

      {/* Footer */}
      <LandingPageFooter />

      {/* Chatbot */}
      <LandingPageChatbot />
    </div>
  )
}
