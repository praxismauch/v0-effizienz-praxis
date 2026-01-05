import { LandingPageLayout } from "@/components/landing-page-layout"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

export default function UpdatesPage() {
  return (
    <LandingPageLayout>
      {/* Content */}
      <section className="container py-12 md:py-20">
        <div className="max-w-5xl mx-auto text-center space-y-6">
          <div className="inline-block rounded-lg bg-primary/10 px-3 py-1 text-sm text-primary">Updates</div>
          <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-balance leading-tight">
            Produktupdates
          </h1>
          <p className="text-lg text-muted-foreground text-pretty max-w-[700px] mx-auto">
            Erfahren Sie mehr über neue Features und Verbesserungen
          </p>
          <div className="pt-4">
            <Link href="/whats-new">
              <Button size="lg">
                Alle Updates ansehen
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </LandingPageLayout>
  )
}
