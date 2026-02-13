"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Briefcase, DollarSign, Clock } from "lucide-react"
import type { CompetitorAnalysis, Service } from "../types"

interface ServicesTabProps {
  analysis: CompetitorAnalysis
}

export function ServicesTab({ analysis }: ServicesTabProps) {
  const services: Service[] = analysis.services || []

  if (services.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Keine Dienstleistungen erfasst
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {services.map((service, index) => (
        <Card key={index} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between">
              <div className="p-2 rounded-lg bg-primary/10">
                <Briefcase className="h-5 w-5 text-primary" />
              </div>
              {service.isPopular && (
                <Badge variant="secondary">Beliebt</Badge>
              )}
            </div>
            <CardTitle className="text-lg mt-2">{service.name}</CardTitle>
            {service.description && (
              <CardDescription>{service.description}</CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-2">
            {service.price && (
              <div className="flex items-center gap-2 text-sm">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span>{service.price}</span>
              </div>
            )}
            {service.duration && (
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>{service.duration}</span>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
