"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { User, Calendar, Clock, DollarSign, Globe } from "lucide-react"
import type { Candidate } from "../types"
import { formatDate, formatCurrency } from "../utils"

interface PersonalDetailsCardProps {
  candidate: Candidate
}

export function PersonalDetailsCard({ candidate }: PersonalDetailsCardProps) {
  const hasPersonalDetails =
    candidate.date_of_birth ||
    candidate.weekly_hours ||
    candidate.salary_expectation ||
    candidate.availability_date ||
    candidate.source ||
    candidate.first_contact_date

  if (!hasPersonalDetails) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Persönliche Details & Präferenzen
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          {candidate.date_of_birth && (
            <div>
              <p className="text-sm text-muted-foreground flex items-center gap-2 mb-1">
                <Calendar className="h-4 w-4" />
                Geburtsdatum
              </p>
              <p className="font-medium">{formatDate(candidate.date_of_birth)}</p>
            </div>
          )}
          {candidate.weekly_hours && (
            <div>
              <p className="text-sm text-muted-foreground flex items-center gap-2 mb-1">
                <Clock className="h-4 w-4" />
                Wochenstunden
              </p>
              <p className="font-medium">{candidate.weekly_hours} Std./Woche</p>
            </div>
          )}
          {candidate.salary_expectation && (
            <div>
              <p className="text-sm text-muted-foreground flex items-center gap-2 mb-1">
                <DollarSign className="h-4 w-4" />
                Gehaltsvorstellung
              </p>
              <p className="font-medium">{formatCurrency(candidate.salary_expectation)}</p>
            </div>
          )}
          {candidate.availability_date && (
            <div>
              <p className="text-sm text-muted-foreground flex items-center gap-2 mb-1">
                <Calendar className="h-4 w-4" />
                Verfügbar ab
              </p>
              <p className="font-medium">{formatDate(candidate.availability_date)}</p>
            </div>
          )}
          {candidate.source && (
            <div>
              <p className="text-sm text-muted-foreground flex items-center gap-2 mb-1">
                <Globe className="h-4 w-4" />
                Quelle
              </p>
              <p className="font-medium capitalize">{candidate.source}</p>
            </div>
          )}
          {candidate.first_contact_date && (
            <div>
              <p className="text-sm text-muted-foreground flex items-center gap-2 mb-1">
                <Calendar className="h-4 w-4" />
                Erste Kontaktaufnahme
              </p>
              <p className="font-medium">{formatDate(candidate.first_contact_date)}</p>
            </div>
          )}
          {candidate.created_at && (
            <div>
              <p className="text-sm text-muted-foreground flex items-center gap-2 mb-1">
                <Calendar className="h-4 w-4" />
                Erstellt am
              </p>
              <p className="font-medium">{formatDate(candidate.created_at)}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
