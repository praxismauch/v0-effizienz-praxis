"use client"

import { AppLayout } from "@/components/app-layout"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import useSWR from "swr"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import {
  ArrowLeft,
  Edit,
  Trash2,
  Key,
  Laptop,
  Smartphone,
  ShirtIcon,
  Package,
  Calendar,
  Euro,
  Hash,
  User,
  FileText,
  ImageIcon,
  Shield,
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
import EditArbeitsmittelDialog from "@/components/arbeitsmittel/edit-arbeitsmittel-dialog"
import { useAuth } from "@/contexts/auth-context"
import { usePractice } from "@/contexts/practice-context"
import { useToast } from "@/hooks/use-toast"
import { SWR_KEYS } from "@/lib/swr-keys"
import Image from "next/image"

const typeIcons: Record<string, any> = {
  Schlüssel: Key,
  Dienstkleidung: ShirtIcon,
  "Dienst Handy": Smartphone,
  "Dienst Laptop": Laptop,
  Sonstiges: Package,
}

const statusColors: Record<string, string> = {
  available: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  assigned: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  maintenance: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  retired: "bg-gray-500/10 text-gray-600 border-gray-500/20",
}

const statusLabels: Record<string, string> = {
  available: "Verfügbar",
  assigned: "Zugewiesen",
  maintenance: "Wartung",
  retired: "Ausgemustert",
}

const conditionColors: Record<string, string> = {
  Neu: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  Gut: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  Gebraucht: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  Defekt: "bg-red-500/10 text-red-600 border-red-500/20",
}

function DetailRow({ icon: Icon, label, value }: { icon: any; label: string; value: React.ReactNode }) {
  if (!value || value === "-") return null
  return (
    <div className="flex items-start gap-3 py-3">
      <Icon className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-muted-foreground">{label}</p>
        <div className="font-medium mt-0.5">{value}</div>
      </div>
    </div>
  )
}

export default function ArbeitsmittelDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const { currentPractice } = usePractice()
  const { toast } = useToast()
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const itemId = params.id as string

  const { data: item, error, isLoading, mutate } = useSWR(
    currentPractice?.id && itemId
      ? `/api/practices/${currentPractice.id}/arbeitsmittel/${itemId}`
      : null,
    async (url) => {
      const response = await fetch(url)
      if (!response.ok) throw new Error("Failed to fetch")
      return response.json()
    },
  )

  const { data: teamMembers } = useSWR(
    currentPractice?.id ? SWR_KEYS.teamMembers(currentPractice.id) : null,
    async (url) => {
      const response = await fetch(url)
      if (!response.ok) throw new Error("Failed to fetch team members")
      const data = await response.json()
      const members = data?.teamMembers || data
      return Array.isArray(members) ? members : []
    },
  )

  const handleDelete = async () => {
    if (!currentPractice?.id || !itemId) return
    try {
      const response = await fetch(`/api/practices/${currentPractice.id}/arbeitsmittel/${itemId}`, {
        method: "DELETE",
      })
      if (!response.ok) throw new Error("Failed to delete")
      toast({ title: "Gelöscht", description: "Arbeitsmittel wurde erfolgreich gelöscht." })
      router.push("/arbeitsmittel")
    } catch {
      toast({ title: "Fehler", description: "Fehler beim Löschen", variant: "destructive" })
    } finally {
      setDeleteDialogOpen(false)
    }
  }

  const Icon = item ? typeIcons[item.type] || Package : Package

  const assignedMember =
    item?.assigned_to && Array.isArray(teamMembers)
      ? teamMembers.find((m: any) => m.id === item.assigned_to || m.user_id === item.assigned_to)
      : null

  const assignedName = assignedMember
    ? `${assignedMember.first_name || ""} ${assignedMember.last_name || ""}`.trim() || assignedMember.email
    : null

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null
    try {
      return new Date(dateStr).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" })
    } catch {
      return dateStr
    }
  }

  const formatCurrency = (amount: number | null) => {
    if (amount == null) return null
    return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(amount)
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/arbeitsmittel")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          {isLoading ? (
            <div className="space-y-2 flex-1">
              <Skeleton className="h-7 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          ) : item ? (
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-muted p-2">
                  <Icon className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">{item.name}</h1>
                  <p className="text-muted-foreground">{item.type}</p>
                </div>
              </div>
            </div>
          ) : null}
          {item && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setEditDialogOpen(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Bearbeiten
              </Button>
              <Button
                variant="outline"
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Löschen
              </Button>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="md:col-span-2">
              <CardContent className="p-6 space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <Skeleton className="h-48 w-full" />
              </CardContent>
            </Card>
          </div>
        ) : error ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Arbeitsmittel konnte nicht geladen werden.
            </CardContent>
          </Card>
        ) : item ? (
          <div className="grid gap-6 md:grid-cols-3">
            {/* Main Info */}
            <Card className="md:col-span-2">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <CardTitle className="text-lg">Details</CardTitle>
                  <Badge variant="outline" className={statusColors[item.status]}>
                    {statusLabels[item.status] || item.status}
                  </Badge>
                  {item.condition && (
                    <Badge variant="outline" className={conditionColors[item.condition] || ""}>
                      {item.condition}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-0">
                {item.description && (
                  <>
                    <p className="text-muted-foreground leading-relaxed">{item.description}</p>
                    <Separator className="my-4" />
                  </>
                )}

                <div className="divide-y divide-border">
                  <DetailRow icon={Hash} label="Seriennummer" value={item.serial_number} />
                  <DetailRow icon={Calendar} label="Kaufdatum" value={formatDate(item.purchase_date)} />
                  <DetailRow icon={Euro} label="Kaufpreis" value={formatCurrency(item.purchase_price)} />
                  <DetailRow icon={Shield} label="Garantie bis" value={formatDate(item.warranty_until)} />
                  <DetailRow
                    icon={User}
                    label="Zugewiesen an"
                    value={assignedName}
                  />
                  {item.assigned_date && (
                    <DetailRow icon={Calendar} label="Zugewiesen am" value={formatDate(item.assigned_date)} />
                  )}
                  {item.return_date && (
                    <DetailRow icon={Calendar} label="Rückgabe am" value={formatDate(item.return_date)} />
                  )}
                </div>

                {item.notes && (
                  <>
                    <Separator className="my-4" />
                    <DetailRow
                      icon={FileText}
                      label="Notizen"
                      value={<p className="whitespace-pre-wrap">{item.notes}</p>}
                    />
                  </>
                )}
              </CardContent>
            </Card>

            {/* Image Sidebar */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Bild</CardTitle>
                </CardHeader>
                <CardContent>
                  {item.image_url ? (
                    <div className="relative aspect-square overflow-hidden rounded-lg border border-border">
                      <Image
                        src={item.image_url}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="aspect-square rounded-lg bg-muted/30 flex items-center justify-center border border-dashed border-border">
                      <div className="text-center">
                        <ImageIcon className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">Kein Bild vorhanden</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Info Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Kurzinfo</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Typ</span>
                    <span className="font-medium">{item.type}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Status</span>
                    <Badge variant="outline" className={statusColors[item.status]}>
                      {statusLabels[item.status] || item.status}
                    </Badge>
                  </div>
                  {item.condition && (
                    <>
                      <Separator />
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Zustand</span>
                        <span className="font-medium">{item.condition}</span>
                      </div>
                    </>
                  )}
                  {assignedName && (
                    <>
                      <Separator />
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Zugewiesen</span>
                        <span className="font-medium">{assignedName}</span>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        ) : null}

        {/* Edit Dialog */}
        {item && (
          <EditArbeitsmittelDialog
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            onSuccess={() => mutate()}
            item={item}
            teamMembers={teamMembers || []}
          />
        )}

        {/* Delete Confirmation */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Arbeitsmittel löschen?</AlertDialogTitle>
              <AlertDialogDescription>
                Möchten Sie &quot;{item?.name}&quot; wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
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
