"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { AppLayout } from "@/components/app-layout"
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  GraduationCap,
  Star,
  Download,
  ExternalLink,
  FileText,
  Eye,
  Calendar,
  DollarSign,
  Clock,
  User,
  LinkIcon,
  Globe,
  MessageSquare,
  Pencil,
} from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DocumentViewerDialog } from "@/components/hiring/document-viewer-dialog"
import EditCandidateDialog from "@/components/hiring/edit-candidate-dialog"

interface CandidateDetails {
  candidate: any
  applications: any[]
  interviews: any[]
}

export default function CandidateDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [details, setDetails] = useState<CandidateDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedDocument, setSelectedDocument] = useState<{ name: string; url: string; type?: string } | null>(null)
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
  }, [params, mounted])

  const loadCandidateDetails = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log("[v0] Loading candidate details...")
      const resolvedParams = await params
      console.log("[v0] Resolved params:", resolvedParams)
      const response = await fetch(`/api/hiring/candidates/${resolvedParams.id}/details`)
      console.log("[v0] Response status:", response.status)

      if (response.status === 429) {
        console.log("[v0] Rate limited, retrying...")
        await new Promise((r) => setTimeout(r, 1000))
        const retryResponse = await fetch(`/api/hiring/candidates/${resolvedParams.id}/details`)
        if (retryResponse.ok) {
          const data = await retryResponse.json()
          console.log("[v0] Retry successful, data:", data)
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
        console.log("[v0] Error response:", errorData)
        setError(errorData.error || "Fehler beim Laden des Kandidaten")
        return
      }

      const data = await response.json()
      console.log("[v0] Candidate data loaded:", data)
      setDetails(data)
    } catch (error) {
      console.error("[v0] Error loading candidate details:", error)
      setError("Fehler beim Laden des Kandidaten")
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      new: { variant: "secondary", label: "Neu" },
      screening: { variant: "default", label: "Screening" },
      interviewing: { variant: "default", label: "Interview" },
      offer: { variant: "default", label: "Angebot" },
      hired: { variant: "success", label: "Eingestellt" },
      rejected: { variant: "destructive", label: "Abgelehnt" },
      withdrawn: { variant: "outline", label: "Zurückgezogen" },
      archived: { variant: "outline", label: "Archiviert" },
    }
    const config = variants[status] || variants.new
    return <Badge variant={config.variant}>{config.label}</Badge>
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

  const getInitials = (name: string) => {
    const names = name.split(" ")
    return names
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-"
    return new Date(dateString).toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  const formatCurrency = (amount: number | null) => {
    if (!amount) return "-"
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: "EUR",
    }).format(amount)
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

  const { candidate, applications, interviews } = details

  const handleViewDocument = (doc: any) => {
    setSelectedDocument({
      name: doc.name,
      url: doc.url,
      type: doc.type,
    })
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

        {/* Contact Information */}
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
                  <p>
                    {candidate.address && (
                      <span>
                        {candidate.address}
                        <br />
                      </span>
                    )}
                    {candidate.postal_code} {candidate.city}
                    {candidate.country && <span>, {candidate.country}</span>}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Personal Details & Preferences */}
        {(candidate.date_of_birth ||
          candidate.weekly_hours ||
          candidate.salary_expectation ||
          candidate.availability_date ||
          candidate.source ||
          candidate.first_contact_date) && (
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
        )}

        {/* Current Employment & Experience */}
        {(candidate.current_position || candidate.current_company || candidate.years_of_experience) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Berufserfahrung & Beschäftigung
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {candidate.current_position && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Aktuelle Position</p>
                    <p className="font-medium">{candidate.current_position}</p>
                  </div>
                )}
                {candidate.current_company && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Aktuelles Unternehmen</p>
                    <p className="font-medium">{candidate.current_company}</p>
                  </div>
                )}
                {candidate.years_of_experience !== undefined && candidate.years_of_experience !== null && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Berufserfahrung</p>
                    <p className="font-medium">{candidate.years_of_experience} Jahre</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Education & Skills */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Ausbildung & Qualifikationen
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {candidate.education && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Ausbildung</p>
                <p className="whitespace-pre-wrap">{candidate.education}</p>
              </div>
            )}
            {candidate.skills && candidate.skills.length > 0 && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Fähigkeiten</p>
                <div className="flex flex-wrap gap-2">
                  {candidate.skills.map((skill: string, idx: number) => (
                    <Badge key={idx} variant="secondary">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {candidate.languages && candidate.languages.length > 0 && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Sprachen</p>
                <div className="flex flex-wrap gap-2">
                  {candidate.languages.map((lang: string, idx: number) => (
                    <Badge key={idx} variant="outline">
                      {lang}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {candidate.certifications && candidate.certifications.length > 0 && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Zertifikate</p>
                <ul className="list-disc list-inside space-y-1">
                  {candidate.certifications.map((cert: string, idx: number) => (
                    <li key={idx}>{cert}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

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

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Dokumente & Links
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* External Links */}
              {(candidate.resume_url || candidate.portfolio_url || candidate.linkedin_url) && (
                <div>
                  <p className="text-sm text-muted-foreground mb-3">Externe Links</p>
                  <div className="space-y-2">
                    {candidate.resume_url && (
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">Lebenslauf</p>
                            <p className="text-sm text-muted-foreground">Online Lebenslauf</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" asChild>
                            <a href={candidate.resume_url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                        </div>
                      </div>
                    )}
                    {candidate.portfolio_url && (
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Globe className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">Portfolio</p>
                            <p className="text-sm text-muted-foreground">Online Portfolio</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" asChild>
                            <a href={candidate.portfolio_url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                        </div>
                      </div>
                    )}
                    {candidate.linkedin_url && (
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <LinkIcon className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">LinkedIn</p>
                            <p className="text-sm text-muted-foreground">LinkedIn Profil</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" asChild>
                            <a href={candidate.linkedin_url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Uploaded Documents */}
              {candidate.documents && candidate.documents.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-3">Hochgeladene Dokumente</p>
                  <div className="space-y-2">
                    {candidate.documents.map((doc: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{doc.filename || doc.name || "Dokument"}</p>
                            <p className="text-sm text-muted-foreground">
                              {doc.size && `${(doc.size / 1024).toFixed(1)} KB`}
                              {doc.uploadedAt && ` • ${formatDate(doc.uploadedAt)}`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleViewDocument({
                                name: doc.filename || doc.name || "Dokument",
                                url: doc.url,
                                type: doc.type,
                              })
                            }
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" asChild>
                            <a href={doc.url} download={doc.filename || doc.name}>
                              <Download className="h-4 w-4" />
                            </a>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* No documents message */}
              {!candidate.resume_url &&
                !candidate.portfolio_url &&
                !candidate.linkedin_url &&
                (!candidate.documents || candidate.documents.length === 0) && (
                  <p className="text-sm text-muted-foreground text-center py-4">Keine Dokumente oder Links verfügbar</p>
                )}
            </div>
          </CardContent>
        </Card>

        {/* Applications History */}
        {applications.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Bewerbungsverlauf</CardTitle>
              <CardDescription>{applications.length} Bewerbung(en)</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Stelle</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Phase</TableHead>
                    <TableHead>Bewerbungsdatum</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {applications.map((app) => (
                    <TableRow key={app.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{app.job_postings?.title}</p>
                          <p className="text-sm text-muted-foreground">{app.job_postings?.department}</p>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(app.status)}</TableCell>
                      <TableCell>{app.stage || "-"}</TableCell>
                      <TableCell>{formatDate(app.applied_at)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Notes */}
        {candidate.notes && (
          <Card>
            <CardHeader>
              <CardTitle>Notizen</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{candidate.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Document Viewer Dialog */}
      <DocumentViewerDialog
        open={documentDialogOpen}
        onOpenChange={setDocumentDialogOpen}
        document={selectedDocument}
      />

      {/* Edit Candidate Dialog */}
      <EditCandidateDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        candidate={candidate}
        onSuccess={() => {
          loadCandidateDetails()
          setEditDialogOpen(false)
        }}
      />
    </AppLayout>
  )
}
