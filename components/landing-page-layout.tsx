import type React from "react"
import { LandingPageHeader } from "@/components/landing-page-header"
import { LandingPageFooter } from "@/components/landing-page-footer"
import { LandingPageChatbot } from "@/components/landing-page-chatbot"

interface LandingPageLayoutProps {
  children: React.ReactNode
  showChatbot?: boolean
}

export function LandingPageLayout({ children, showChatbot = true }: LandingPageLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-muted/20">
      <LandingPageHeader />
      <main className="flex-1">{children}</main>
      <LandingPageFooter />
      {showChatbot && <LandingPageChatbot />}
    </div>
  )
}

export default LandingPageLayout
