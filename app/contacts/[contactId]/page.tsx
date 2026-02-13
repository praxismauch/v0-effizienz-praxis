"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { AppLayout } from "@/components/app-layout"
import { useUser } from "@/contexts/user-context"
import { usePractice } from "@/contexts/practice-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  Smartphone,
  Globe,
  MapPin,
  Edit,
  Trash2,
  Star,
  User,
  Briefcase,
  Calendar,
  Linkedin,
  FileText,
  Sparkles,
  Loader2,
  Printer,
  ExternalLink,
} from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { EditContactDialog } from "@/components/contacts/edit-contact-dialog"

interface Contact {
  id: string
  practice_id: string
  salutation: string | null
  title: string | null
  first_name: string | null
  last_name: string | null
  company: string | null
  position: string | null
  email: string | null
  phone: string | null
  mobile: string | null
  fax: string | null
  website: string | null
  street: string | null
  house_number: string | null
  postal_code: string | null
  city: string | null
  country: string | null
  category: string | null
  notes: string | null
  tags: string[] | null
  image_url: string | null
  ai_extracted: boolean | null
  ai_confidence: number | null
  is_favorite: boolean | null
  department: string | null
  birthday: string | null
  linkedin: string | null
  source: string | null
  created_at: string
  updated_at: string
}

function ContactInfoRow({ icon: Icon, label, value, href }: {
  icon: React.ElementType
  label: string
  value: string | null | undefined
  href?: string
}) {
  if (!value) return null
  return (
    <div className="flex items-start gap-3 py-2">
      <Icon className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        {href ? (
          <a href={href} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline break-all">
            {value}
          </a>
        ) : (
          <p className="text-sm break-all">{value}</p>
        )}
      </div>
    </div>
  )
}

export default function ContactDetailPage() {
  const params = useParams()
  const router = useRouter()
  const contactId = params.contactId as string
  const { currentUser } = useUser()
  const { currentPractice } = usePractice()
  const { toast } = useToast()

  const [contact, setContact] = useState<Contact | null>(null)
  const [loading, setLoading] = useState(true)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const practiceId = currentPractice?.id?.toString()

  const loadContact = useCallback(async () => {
    if (!practiceId || !contactId) return
    setLoading(true)
    try {
      const response = await fetch(`/api/practices/${practiceId}/contacts/${contactId}`)
      if (!response.ok) throw new Error("Kontakt nicht gefunden")
      const data = await response.json()
      setContact(data)
    } catch {
      toast({ title: "Fehler", description: "Kontakt konnte nicht geladen werden.", variant: "destructive" })
      router.push("/contacts")
    } finally {
      setLoading(false)
    }
  }, [practiceId, contactId, toast, router])

  useEffect(() => {
    loadContact()
  }, [loadContact])

  async function toggleFavorite() {
    if (!contact || !practiceId) return
    try {
      const response = await fetch(`/api/practices/${practiceId}/contacts`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: contact.id, is_favorite: !contact.is_favorite }),
      })
      if (response.ok) {
        setContact((prev) => prev ? { ...prev, is_favorite: !prev.is_favorite } : null)
      }
    } catch { /* ignore */ }
  }

  async function handleDelete() {
    if (!contact || !practiceId) return
    try {
      const response = await fetch(`/api/practices/${practiceId}/contacts?id=${contact.id}`, {
        method: "DELETE",
      })
      if (response.ok) {
        toast({ title: "Kontakt gelöscht" })
        router.push("/contacts")
      }
    } catch {
      toast({ title: "Fehler", description: "Kontakt konnte nicht gelöscht werden.", variant: "destructive" })
    }
  }

  const fullName = contact
    ? [contact.salutation, contact.title, contact.first_name, contact.last_name].filter(Boolean).join(" ")
    : ""

  const fullAddress = contact
    ? [
        [contact.street, contact.house_number].filter(Boolean).join(" "),
        [contact.postal_code, contact.city].filter(Boolean).join(" "),
        contact.country,
      ].filter(Boolean).join(", ")
    : ""

  const mapsUrl = fullAddress
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`
    : null

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    )
  }

  if (!contact) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
          <p className="text-muted-foreground">Kontakt nicht gefunden.</p>
          <Button variant="outline" onClick={() => router.push("/contacts")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zurück zur Kontaktliste
          </Button>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="container mx-auto py-6 px-4 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => router.push("/contacts")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold tracking-tight text-balance">{fullName || "Kein Name"}</h1>
              {contact.is_favorite && (
                <Star className="h-5 w-5 fill-amber-400 text-amber-400 flex-shrink-0" />
              )}
              {contact.ai_extracted && (
                <Badge variant="secondary" className="flex-shrink-0">
                  <Sparkles className="h-3 w-3 mr-1" />
                  KI-extrahiert
                </Badge>
              )}
              {contact.category && (
                <Badge variant="outline" className="flex-shrink-0">{contact.category}</Badge>
              )}
            </div>
            {contact.position && (
              <p className="text-muted-foreground mt-1">{contact.position}{contact.company ? ` bei ${contact.company}` : ""}</p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 mb-6">
          <Button variant="outline" size="sm" onClick={toggleFavorite}>
            <Star className={`h-4 w-4 mr-2 ${contact.is_favorite ? "fill-amber-400 text-amber-400" : ""}`} />
            {contact.is_favorite ? "Favorit entfernen" : "Als Favorit"}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowEditDialog(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Bearbeiten
          </Button>
          {contact.email && (
            <Button variant="outline" size="sm" asChild>
              <a href={`mailto:${contact.email}`}>
                <Mail className="h-4 w-4 mr-2" />
                E-Mail senden
              </a>
            </Button>
          )}
          {(contact.phone || contact.mobile) && (
            <Button variant="outline" size="sm" asChild>
              <a href={`tel:${contact.phone || contact.mobile}`}>
                <Phone className="h-4 w-4 mr-2" />
                Anrufen
              </a>
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="h-4 w-4 mr-2" />
            Drucken
          </Button>
          <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => setShowDeleteDialog(true)}>
            <Trash2 className="h-4 w-4 mr-2" />
            Löschen
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Contact Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4" />
                Kontaktdaten
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-0">
              <ContactInfoRow icon={Mail} label="E-Mail" value={contact.email} href={contact.email ? `mailto:${contact.email}` : undefined} />
              <ContactInfoRow icon={Phone} label="Telefon" value={contact.phone} href={contact.phone ? `tel:${contact.phone}` : undefined} />
              <ContactInfoRow icon={Smartphone} label="Mobil" value={contact.mobile} href={contact.mobile ? `tel:${contact.mobile}` : undefined} />
              <ContactInfoRow icon={Phone} label="Fax" value={contact.fax} />
              <ContactInfoRow icon={Globe} label="Website" value={contact.website} href={contact.website?.startsWith("http") ? contact.website : contact.website ? `https://${contact.website}` : undefined} />
              <ContactInfoRow icon={Linkedin} label="LinkedIn" value={contact.linkedin} href={contact.linkedin?.startsWith("http") ? contact.linkedin : contact.linkedin ? `https://${contact.linkedin}` : undefined} />
              {contact.birthday && (
                <ContactInfoRow icon={Calendar} label="Geburtstag" value={new Date(contact.birthday).toLocaleDateString("de-DE")} />
              )}
            </CardContent>
          </Card>

          {/* Company & Address */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Firma & Adresse
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-0">
              <ContactInfoRow icon={Building2} label="Firma" value={contact.company} />
              <ContactInfoRow icon={Briefcase} label="Position" value={contact.position} />
              <ContactInfoRow icon={Briefcase} label="Abteilung" value={contact.department} />
              {fullAddress && (
                <div className="flex items-start gap-3 py-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Adresse</p>
                    <p className="text-sm">
                      {contact.street} {contact.house_number}
                      <br />
                      {contact.postal_code} {contact.city}
                      {contact.country && <><br />{contact.country}</>}
                    </p>
                    {mapsUrl && (
                      <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline inline-flex items-center gap-1 mt-1">
                        <ExternalLink className="h-3 w-3" />
                        In Google Maps öffnen
                      </a>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          {contact.notes && (
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Notizen
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{contact.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Tags */}
          {contact.tags && contact.tags.length > 0 && (
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">Tags</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {contact.tags.map((tag, i) => (
                    <Badge key={i} variant="secondary">{tag}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Metadata */}
          <Card className="md:col-span-2">
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-x-8 gap-y-2 text-xs text-muted-foreground">
                <span>Erstellt: {new Date(contact.created_at).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                <span>Aktualisiert: {new Date(contact.updated_at).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                {contact.source && <span>Quelle: {contact.source}</span>}
                {contact.ai_confidence != null && <span>KI-Konfidenz: {Math.round(contact.ai_confidence * 100)}%</span>}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Edit Dialog */}
        {contact && (
          <EditContactDialog
            open={showEditDialog}
            onOpenChange={setShowEditDialog}
            contact={contact}
            onSuccess={loadContact}
          />
        )}

        {/* Delete Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Kontakt löschen?</AlertDialogTitle>
              <AlertDialogDescription>
                Möchten Sie den Kontakt &quot;{fullName}&quot; wirklich löschen?
                Diese Aktion kann nicht rückgängig gemacht werden.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Abbrechen</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Löschen
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  )
}
