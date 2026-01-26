"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { AppLayout } from "@/components/app-layout"
import { ArrowLeft, Star, MessageSquare, Pencil } from "lucide-react"
import { DocumentViewerDialog } from "@/components/hiring/document-viewer-dialog"
import EditCandidateDialog from "@/components/hiring/edit-candidate-dialog"

// Import extracted components
import { ContactCard } from "./components/contact-card"
import { PersonalDetailsCard } from "./components/personal-details-card"
import { ExperienceCard } from "./components/experience-card"
import { EducationCard } from "./components/education-card"
import { DocumentsCard } from "./components/documents-card"
import { ApplicationsCard } from "./components/applications-card"
import type { CandidateDetails, Document } from "./types"
import { getStatusBadge, getInitials } from "./utils"

export default function CandidateDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [details, setDetails] = useState<CandidateDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const [documentDialogOpen, setDocumentDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted) {
      loadCandidateDetails()
    }
  }, [resolvedParams.id, mounted])

  const loadCandidateDetails = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`/api/hiring/candidates/${resolvedParams.id}/details`)

      if (response.status === 429) {
        await new Promise((r) => setTimeout(r, 1000))
        const retryResponse = await fetch(`/api/hiring/candidates/${resolvedParams.id}/details`)
        if (retryResponse.ok) {
          const data = await retryResponse.json()
          setDetails(data)
          return
        }
        setError("Zu viele Anfragen. Bitte versuchen Sie es später erneut.")
        return
      }

      if (response.status === 404) {
        setError("Kandidat nicht gefunden")
        return
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        setError(errorData.error || "Fehler beim Laden des Kandidaten")
        return
      }

      const data = await response.json()
      setDetails(data)
    } catch (error) {
      console.error("Error loading candidate details:", error)
      setError("Fehler beim Laden des Kandidaten")
    } finally {
      setLoading(false)
    }
  }

  const renderRating = (rating: number) => {
    if (!rating) return <span className="text-muted-foreground">Keine Bewertung</span>
    return (
      <div className="flex items-center gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} className={`h-4 w-4 ${i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />
        ))}
        <span className="ml-2 text-sm text-muted-foreground">({rating}/5)</span>
      </div>
    )
  }

  if (!mounted) {
    return null
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="p-8 flex items-center justify-center min-h-[50vh]">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="text-muted-foreground">Kandidat wird geladen...</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  if (error || !details) {
    return (
      <AppLayout>
        <div className="p-8 flex flex-col items-center justify-center min-h-[50vh] gap-4">
          <p className="text-muted-foreground">{error || "Kandidat nicht gefunden"}</p>
          <div className="flex gap-2">
            <Button onClick={() => router.push("/hiring?tab=candidates")} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Zurück
            </Button>
            <Button onClick={loadCandidateDetails} variant="default">
              Erneut versuchen
            </Button>
          </div>
        </div>
      </AppLayout>
    )
  }

  const { candidate, applications } = details

  const handleViewDocument = (doc: Document) => {
    setSelectedDocument(doc)
    setDocumentDialogOpen(true)
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.push("/hiring?tab=candidates")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Zurück
            </Button>
            <Avatar className="h-16 w-16">
              <AvatarImage
                src={candidate.image_url || undefined}
                alt={`${candidate.first_name} ${candidate.last_name}`}
              />
              <AvatarFallback className="text-xl">
                {getInitials(`${candidate.first_name} ${candidate.last_name}`)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-3xl font-bold">
                {candidate.first_name} {candidate.last_name}
              </h1>
              <p className="text-muted-foreground">{candidate.current_position || "Kandidat"}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => setEditDialogOpen(true)}>
              <Pencil className="h-4 w-4 mr-2" />
              Bearbeiten
            </Button>
            {getStatusBadge(candidate.status)}
            {candidate.rating && renderRating(candidate.rating)}
          </div>
        </div>

        {/* Extracted Components */}
        <ContactCard candidate={candidate} />
        <PersonalDetailsCard candidate={candidate} />
        <ExperienceCard candidate={candidate} />
        <EducationCard candidate={candidate} />

        {/* Cover Letter */}
        {candidate.cover_letter && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Anschreiben
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{candidate.cover_letter}</p>
            </CardContent>
          </Card>
        )}

        <DocumentsCard candidate={candidate} onViewDocument={handleViewDocument} />
        <ApplicationsCard applications={applications} />

        {/* Notes */}
        {candidate.notes && (
          <Card>
            <CardHeader>
              <CardTitle>Interne Notizen</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{candidate.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Dialogs */}
      <DocumentViewerDialog
        open={documentDialogOpen}
        onOpenChange={setDocumentDialogOpen}
        document={selectedDocument}
      />

      <EditCandidateDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        candidate={candidate}
        onSuccess={() => {
          setEditDialogOpen(false)
          loadCandidateDetails()
        }}
      />
    </AppLayout>
  )
}
