"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail, Phone, MapPin } from "lucide-react"
import type { Candidate } from "../types"

interface ContactInfoCardProps {
  candidate: Candidate
}

export function ContactInfoCard({ candidate }: ContactInfoCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Kontaktinformationen</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <Mail className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="text-sm text-muted-foreground">E-Mail</p>
            <a href={`mailto:${candidate.email}`} className="text-blue-600 hover:underline">
              {candidate.email}
            </a>
          </div>
        </div>
        {candidate.phone && (
          <div className="flex items-center gap-3">
            <Phone className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Telefon</p>
              <a href={`tel:${candidate.phone}`} className="hover:underline">
                {candidate.phone}
              </a>
            </div>
          </div>
        )}
        {candidate.mobile && (
          <div className="flex items-center gap-3">
            <Phone className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Mobil</p>
              <a href={`tel:${candidate.mobile}`} className="hover:underline">
                {candidate.mobile}
              </a>
            </div>
          </div>
        )}
        {(candidate.address || candidate.city) && (
          <div className="flex items-center gap-3">
            <MapPin className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Adresse</p>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  [candidate.address, candidate.postal_code, candidate.city, candidate.country]
                    .filter(Boolean)
                    .join(", ")
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                {candidate.address && (
                  <span>
                    {candidate.address}
                    <br />
                  </span>
                )}
                {candidate.postal_code} {candidate.city}
                {candidate.country && <span>, {candidate.country}</span>}
              </a>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
