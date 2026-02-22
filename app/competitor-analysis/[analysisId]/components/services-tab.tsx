"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Briefcase, DollarSign } from "lucide-react"
import type { ServiceComparison, PricingComparison } from "../types"

interface ServicesTabProps {
  serviceComparison?: ServiceComparison | null
  pricingComparison?: PricingComparison | null
}

export function ServicesTab({ serviceComparison, pricingComparison }: ServicesTabProps) {
  const services = serviceComparison?.services || []
  const hasData = services.length > 0 || pricingComparison

  if (!hasData) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Briefcase className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">Keine Dienstleistungen erfasst</p>
          <p className="text-sm text-muted-foreground mt-1">
            Starten Sie eine KI-Analyse, um Dienstleistungsvergleiche zu generieren
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Pricing Overview */}
      {pricingComparison && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Preisvergleich
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pricingComparison.average_consultation_fee && (
              <div>
                <p className="text-sm font-medium">Durchschnittliche Beratungsgebühr</p>
                <p className="text-lg font-bold text-primary">{pricingComparison.average_consultation_fee}</p>
              </div>
            )}
            {pricingComparison.price_positioning && (
              <div>
                <p className="text-sm font-medium">Preispositionierung</p>
                <p className="text-sm text-muted-foreground">{pricingComparison.price_positioning}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Services List */}
      {services.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Angebotene Leistungen im Markt
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {services.map((service, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 p-3 border rounded-lg text-sm"
                >
                  <span className="shrink-0 h-2 w-2 rounded-full bg-primary" />
                  {service}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
