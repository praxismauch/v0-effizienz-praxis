"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AppLayout } from "@/components/app-layout"
import { 
  ArrowLeft, 
  Star, 
  MessageSquare, 
  Pencil, 
  Mail, 
  Phone, 
  Smartphone,
  MapPin, 
  Calendar,
  Clock,
  Euro,
  Briefcase,
  Building2,
  GraduationCap,
  Languages,
  Award,
  FileText,
  ExternalLink,
  Globe,
  Linkedin,
  User,
  CalendarDays,
  TrendingUp,
  ClipboardList,
  StickyNote,
  RefreshCw,
  CalendarCheck,
  CheckCircle2,
  Circle
} from "lucide-react"
import { DocumentViewerDialog } from "@/components/hiring/document-viewer-dialog"
import EditCandidateDialog from "@/components/hiring/edit-candidate-dialog"

import { DocumentsCard } from "./components/documents-card"
import { ApplicationsCard } from "./components/applications-card"
import type { CandidateDetails, Document, Candidate, CandidateEvent } from "./types"
import { getStatusBadge, getInitials, formatDate, formatCurrency, calculateAge, calculateHourlyRate } from "./utils"

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
    if (!rating) return null
    return (
      <div className="flex items-center gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} className={`h-4 w-4 ${i < rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"}`} />
        ))}
        <span className="ml-1 text-sm text-muted-foreground">({rating}/5)</span>
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

  const age = calculateAge(candidate.date_of_birth)
  const hourlyRate = calculateHourlyRate(
    typeof candidate.salary_expectation === 'string' ? parseFloat(candidate.salary_expectation) : candidate.salary_expectation,
    candidate.weekly_hours
  )

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push("/hiring?tab=candidates")} className="shrink-0 mt-1">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Avatar className="h-20 w-20 shrink-0 border-2 border-border">
              <AvatarImage
                src={candidate.image_url || undefined}
                alt={`${candidate.first_name} ${candidate.last_name}`}
              />
              <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                {getInitials(`${candidate.first_name} ${candidate.last_name}`)}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold tracking-tight">
                  {candidate.first_name} {candidate.last_name}
                </h1>
                {getStatusBadge(candidate.status)}
              </div>
              <p className="text-muted-foreground">
                {candidate.current_position || "Kandidat"}
                {candidate.current_company && ` bei ${candidate.current_company}`}
              </p>
              {candidate.rating ? renderRating(candidate.rating) : null}
            </div>
          </div>
          <div className="flex items-center gap-2 lg:shrink-0">
            <Button variant="outline" size="sm" onClick={loadCandidateDetails}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Aktualisieren
            </Button>
            <Button onClick={() => setEditDialogOpen(true)}>
              <Pencil className="h-4 w-4 mr-2" />
              Bearbeiten
            </Button>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Contact & Quick Info */}
          <div className="space-y-6">
            {/* Contact Information Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Kontaktinformationen
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {candidate.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                    <a href={`mailto:${candidate.email}`} className="text-sm text-primary hover:underline truncate">
                      {candidate.email}
                    </a>
                  </div>
                )}
                {candidate.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                    <a href={`tel:${candidate.phone}`} className="text-sm hover:underline">
                      {candidate.phone}
                    </a>
                  </div>
                )}
                {candidate.mobile && (
                  <div className="flex items-center gap-3">
                    <Smartphone className="h-4 w-4 text-muted-foreground shrink-0" />
                    <a href={`tel:${candidate.mobile}`} className="text-sm hover:underline">
                      {candidate.mobile}
                    </a>
                  </div>
                )}
                {(candidate.address || candidate.city) && (
                  <>
                    <Separator />
                    <div className="flex items-start gap-3">
                      <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                      <div className="text-sm">
                        {candidate.address && <p>{candidate.address}</p>}
                        <p>
                          {candidate.postal_code} {candidate.city}
                          {candidate.country && `, ${candidate.country}`}
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Personal Details Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <CalendarDays className="h-4 w-4" />
                  Persönliche Daten
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {candidate.date_of_birth && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Geburtsdatum</span>
                    <span className="text-sm font-medium">
                      {formatDate(candidate.date_of_birth)}
                      {age !== null && <span className="text-muted-foreground ml-1">({age} Jahre)</span>}
                    </span>
                  </div>
                )}
                {candidate.source && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Quelle</span>
                    <Badge variant="outline" className="capitalize">{candidate.source}</Badge>
                  </div>
                )}
                {candidate.first_contact_date && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Erstkontakt</span>
                    <span className="text-sm font-medium">{formatDate(candidate.first_contact_date)}</span>
                  </div>
                )}
                {candidate.created_at && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Erstellt am</span>
                    <span className="text-sm font-medium">{formatDate(candidate.created_at)}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* External Links Card */}
            {(candidate.linkedin_url || candidate.portfolio_url || candidate.resume_url) && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Online-Profile
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {candidate.linkedin_url && (
                    <a
                      href={candidate.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-2 rounded-md hover:bg-muted transition-colors"
                    >
                      <Linkedin className="h-4 w-4 text-[#0A66C2]" />
                      <span className="text-sm">LinkedIn Profil</span>
                      <ExternalLink className="h-3 w-3 ml-auto text-muted-foreground" />
                    </a>
                  )}
                  {candidate.portfolio_url && (
                    <a
                      href={candidate.portfolio_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-2 rounded-md hover:bg-muted transition-colors"
                    >
                      <Globe className="h-4 w-4 text-primary" />
                      <span className="text-sm">Portfolio</span>
                      <ExternalLink className="h-3 w-3 ml-auto text-muted-foreground" />
                    </a>
                  )}
                  {candidate.resume_url && (
                    <a
                      href={candidate.resume_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-2 rounded-md hover:bg-muted transition-colors"
                    >
                      <FileText className="h-4 w-4 text-orange-500" />
                      <span className="text-sm">Lebenslauf (Online)</span>
                      <ExternalLink className="h-3 w-3 ml-auto text-muted-foreground" />
                    </a>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Übersicht</TabsTrigger>
                <TabsTrigger value="qualifications">Qualifikationen</TabsTrigger>
                <TabsTrigger value="documents">Dokumente</TabsTrigger>
                <TabsTrigger value="applications">Bewerbungen</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6 mt-6">
                {/* Employment Preferences */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Briefcase className="h-4 w-4" />
                      Beschäftigung & Präferenzen
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {candidate.current_position && (
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground uppercase tracking-wide">Aktuelle Position</p>
                          <p className="text-sm font-medium">{candidate.current_position}</p>
                        </div>
                      )}
                      {candidate.current_company && (
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground uppercase tracking-wide">Aktuelles Unternehmen</p>
                          <p className="text-sm font-medium">{candidate.current_company}</p>
                        </div>
                      )}
                      {candidate.years_of_experience !== undefined && candidate.years_of_experience !== null && (
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground uppercase tracking-wide">Berufserfahrung</p>
                          <p className="text-sm font-medium">{candidate.years_of_experience} Jahre</p>
                        </div>
                      )}
                      {candidate.weekly_hours && (
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground uppercase tracking-wide">Gewünschte Stunden</p>
                          <p className="text-sm font-medium">{candidate.weekly_hours} Std./Woche</p>
                        </div>
                      )}
                      {candidate.salary_expectation && (
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground uppercase tracking-wide">Gehaltsvorstellung</p>
                          <p className="text-sm font-medium">{formatCurrency(candidate.salary_expectation)}/Monat</p>
                        </div>
                      )}
                      {hourlyRate && (
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground uppercase tracking-wide">Stundenlohn (berechnet)</p>
                          <p className="text-sm font-medium text-primary">{hourlyRate} EUR/Std.</p>
                        </div>
                      )}
                      {candidate.availability_date && (
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground uppercase tracking-wide">Verfügbar ab</p>
                          <p className="text-sm font-medium">{formatDate(candidate.availability_date)}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Events / Appointments */}
                {candidate.events && candidate.events.length > 0 && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <CalendarCheck className="h-4 w-4" />
                        Termine & Ereignisse
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {[...candidate.events]
                          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                          .map((event) => {
                            const getEventTypeLabel = (type: string) => {
                              const labels: Record<string, string> = {
                                'interview_1': '1. Bewerbungsgespräch',
                                'interview_2': '2. Bewerbungsgespräch',
                                'trial_day_1': '1. Tag Probearbeiten',
                                'trial_day_2': '2. Tag Probearbeiten',
                                'other': 'Sonstiges'
                              }
                              return labels[type] || type
                            }
                            const getEventTypeBadgeColor = (type: string) => {
                              if (type.startsWith('interview')) return 'bg-blue-100 text-blue-700 border-blue-200'
                              if (type.startsWith('trial')) return 'bg-emerald-100 text-emerald-700 border-emerald-200'
                              return 'bg-gray-100 text-gray-700 border-gray-200'
                            }
                            return (
                              <div 
                                key={event.id} 
                                className={`flex items-start gap-3 p-3 rounded-lg border ${event.completed ? 'bg-muted/50' : 'bg-background'}`}
                              >
                                {event.completed ? (
                                  <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />
                                ) : (
                                  <Circle className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <Badge variant="outline" className={getEventTypeBadgeColor(event.type)}>
                                      {getEventTypeLabel(event.type)}
                                    </Badge>
                                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                      <Calendar className="h-3.5 w-3.5" />
                                      <span className={event.completed ? 'line-through' : ''}>
                                        {formatDate(event.date)}
                                      </span>
                                    </div>
                                    {event.time && (
                                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                        <Clock className="h-3.5 w-3.5" />
                                        <span className={event.completed ? 'line-through' : ''}>
                                          {event.time} Uhr
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                  {event.notes && (
                                    <p className={`text-sm text-muted-foreground mt-1 ${event.completed ? 'line-through' : ''}`}>
                                      {event.notes}
                                    </p>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Cover Letter */}
                {candidate.cover_letter && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        Anschreiben
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">{candidate.cover_letter}</p>
                    </CardContent>
                  </Card>
                )}

                {/* Internal Notes */}
                {candidate.notes && (
                  <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <StickyNote className="h-4 w-4 text-amber-600" />
                        Interne Notizen
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm whitespace-pre-wrap">{candidate.notes}</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Qualifications Tab */}
              <TabsContent value="qualifications" className="space-y-6 mt-6">
                {/* Education */}
                {candidate.education && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <GraduationCap className="h-4 w-4" />
                        Ausbildung
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm whitespace-pre-wrap">{candidate.education}</p>
                    </CardContent>
                  </Card>
                )}

                {/* Skills */}
                {candidate.skills && Array.isArray(candidate.skills) && candidate.skills.length > 0 && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        Fähigkeiten
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {candidate.skills.map((skill: string, idx: number) => (
                          <Badge key={idx} variant="secondary">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Languages */}
                {candidate.languages && Array.isArray(candidate.languages) && candidate.languages.length > 0 && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Languages className="h-4 w-4" />
                        Sprachen
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {candidate.languages.map((lang: string, idx: number) => (
                          <Badge key={idx} variant="outline">
                            {lang}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Certifications */}
                {candidate.certifications && Array.isArray(candidate.certifications) && candidate.certifications.length > 0 && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Award className="h-4 w-4" />
                        Zertifikate
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {candidate.certifications.map((cert: string, idx: number) => (
                          <li key={idx} className="flex items-center gap-2 text-sm">
                            <Award className="h-3 w-3 text-primary shrink-0" />
                            {cert}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {/* Empty state */}
                {!candidate.education && 
                 (!candidate.skills || candidate.skills.length === 0) && 
                 (!candidate.languages || candidate.languages.length === 0) && 
                 (!candidate.certifications || candidate.certifications.length === 0) && (
                  <Card>
                    <CardContent className="py-8 text-center">
                      <GraduationCap className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                      <p className="text-sm text-muted-foreground">Keine Qualifikationen hinterlegt</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Documents Tab */}
              <TabsContent value="documents" className="mt-6">
                <DocumentsCard candidate={candidate} onViewDocument={handleViewDocument} />
              </TabsContent>

              {/* Applications Tab */}
              <TabsContent value="applications" className="mt-6">
                <ApplicationsCard applications={applications} />
                {applications.length === 0 && (
                  <Card>
                    <CardContent className="py-8 text-center">
                      <ClipboardList className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                      <p className="text-sm text-muted-foreground">Keine Bewerbungen vorhanden</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
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
