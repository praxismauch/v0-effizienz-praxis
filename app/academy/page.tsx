import type { Metadata } from "next"
import { GraduationCap, BookOpen, Video, Award } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export const metadata: Metadata = {
  title: "Effizienz-Academy | Kurse & Weiterbildung",
  description: "Lernen Sie Schritt für Schritt, wie Sie Ihre Praxis effizienter gestalten können.",
}

export default function AcademyPage() {
  return (
    <div className="container max-w-4xl mx-auto py-16 px-4">
      <div className="text-center space-y-6">
        {/* Coming Soon Badge */}
        <Badge variant="secondary" className="text-sm px-4 py-1">
          Coming Soon
        </Badge>

        {/* Icon */}
        <div className="flex justify-center">
          <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
            <GraduationCap className="w-12 h-12 text-primary" />
          </div>
        </div>

        {/* Title and Description */}
        <div className="space-y-3">
          <h1 className="text-4xl font-bold tracking-tight">Effizienz-Academy</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Lernen Sie Schritt für Schritt, wie Sie Ihre Praxis effizienter gestalten können. 
            Unsere Academy wird bald verfügbar sein.
          </p>
        </div>

        {/* Preview Features */}
        <div className="grid md:grid-cols-3 gap-4 pt-8">
          <Card className="border-dashed">
            <CardContent className="pt-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center mx-auto">
                <Video className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold">Video-Kurse</h3>
              <p className="text-sm text-muted-foreground">
                Praxisnahe Video-Tutorials zu allen wichtigen Themen
              </p>
            </CardContent>
          </Card>

          <Card className="border-dashed">
            <CardContent className="pt-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center mx-auto">
                <BookOpen className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold">Interaktive Lernpfade</h3>
              <p className="text-sm text-muted-foreground">
                Strukturierte Lernpfade für verschiedene Themenbereiche
              </p>
            </CardContent>
          </Card>

          <Card className="border-dashed">
            <CardContent className="pt-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center mx-auto">
                <Award className="w-6 h-6 text-amber-600" />
              </div>
              <h3 className="font-semibold">Zertifikate</h3>
              <p className="text-sm text-muted-foreground">
                Erhalten Sie Zertifikate nach erfolgreichem Abschluss
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Coming Soon Notice */}
        <div className="pt-8">
          <p className="text-sm text-muted-foreground">
            Wir arbeiten mit Hochdruck an der Academy. Bleiben Sie gespannt!
          </p>
        </div>
      </div>
    </div>
  )
}
