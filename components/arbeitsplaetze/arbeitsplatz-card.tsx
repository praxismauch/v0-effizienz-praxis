"use client"

import { MapPin, Edit, Trash2, ChevronRight, Monitor, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

interface Room {
  id: string
  name: string
}

interface Arbeitsplatz {
  id: string
  name: string
  beschreibung: string | null
  raum_id: string | null
  is_active: boolean
  room?: Room | null
  image_url?: string | null
}

interface ArbeitsplatzCardProps {
  arbeitsplatz: Arbeitsplatz
  onEdit: (arbeitsplatz: Arbeitsplatz) => void
  onDelete: (id: string) => void
  viewMode?: "grid" | "list"
}

function stripHtml(html: string | null): string {
  if (!html) return ""
  // Remove HTML tags and decode entities
  const doc = new DOMParser().parseFromString(html, "text/html")
  return doc.body.textContent || ""
}

function isHtmlEmpty(html: string | null): boolean {
  if (!html) return true
  const text = stripHtml(html)
  return text.trim() === ""
}

export function ArbeitsplatzCard({ arbeitsplatz, onEdit, onDelete, viewMode = "grid" }: ArbeitsplatzCardProps) {
  const router = useRouter()

  const beschreibungPreview = stripHtml(arbeitsplatz.beschreibung)
  const hasBeschreibung = !isHtmlEmpty(arbeitsplatz.beschreibung)

  if (viewMode === "list") {
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            {arbeitsplatz.image_url ? (
              <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0">
                <img
                  src={arbeitsplatz.image_url || "/placeholder.svg"}
                  alt={arbeitsplatz.name}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div
                className={cn(
                  "p-3 rounded-xl shrink-0",
                  arbeitsplatz.is_active ? "bg-green-100 dark:bg-green-900/30" : "bg-gray-100 dark:bg-gray-800",
                )}
              >
                <Monitor
                  className={cn(
                    "h-5 w-5",
                    arbeitsplatz.is_active ? "text-green-600 dark:text-green-400" : "text-gray-500",
                  )}
                />
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold truncate">{arbeitsplatz.name}</h3>
                <Badge variant={arbeitsplatz.is_active ? "success" : "secondary"} className="shrink-0">
                  {arbeitsplatz.is_active ? "Aktiv" : "Inaktiv"}
                </Badge>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                {arbeitsplatz.room && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {arbeitsplatz.room.name}
                  </span>
                )}
                {hasBeschreibung && <span className="truncate">{beschreibungPreview}</span>}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button variant="outline" size="sm" onClick={() => router.push(`/arbeitsplaetze/${arbeitsplatz.id}`)}>
                <FileText className="h-4 w-4 mr-1" />
                Anweisungen
              </Button>
              <Button variant="ghost" size="icon" onClick={() => onEdit(arbeitsplatz)}>
                <Edit className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => onDelete(arbeitsplatz.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="group hover:shadow-lg transition-all duration-200 overflow-hidden">
      {arbeitsplatz.image_url ? (
        <div className="relative h-40 overflow-hidden">
          <img
            src={arbeitsplatz.image_url || "/placeholder.svg"}
            alt={arbeitsplatz.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-3 left-3 right-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-white text-base truncate">{arbeitsplatz.name}</h3>
              <Badge variant={arbeitsplatz.is_active ? "success" : "secondary"} className="shrink-0">
                {arbeitsplatz.is_active ? "Aktiv" : "Inaktiv"}
              </Badge>
            </div>
            {arbeitsplatz.room && (
              <div className="flex items-center text-sm text-white/80 mt-0.5">
                <MapPin className="h-3 w-3 mr-1 shrink-0" />
                <span className="truncate">{arbeitsplatz.room.name}</span>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Original header without image */
        <div
          className={cn(
            "p-4 border-b",
            arbeitsplatz.is_active
              ? "bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30"
              : "bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-900/30 dark:to-slate-900/30",
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  "p-2.5 rounded-xl shrink-0",
                  arbeitsplatz.is_active ? "bg-green-100 dark:bg-green-900/50" : "bg-gray-100 dark:bg-gray-800",
                )}
              >
                <Monitor
                  className={cn(
                    "h-5 w-5",
                    arbeitsplatz.is_active ? "text-green-600 dark:text-green-400" : "text-gray-500",
                  )}
                />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-base truncate">{arbeitsplatz.name}</h3>
                {arbeitsplatz.room && (
                  <div className="flex items-center text-sm text-muted-foreground mt-0.5">
                    <MapPin className="h-3 w-3 mr-1 shrink-0" />
                    <span className="truncate">{arbeitsplatz.room.name}</span>
                  </div>
                )}
              </div>
            </div>
            <Badge variant={arbeitsplatz.is_active ? "success" : "secondary"} className="shrink-0">
              {arbeitsplatz.is_active ? "Aktiv" : "Inaktiv"}
            </Badge>
          </div>
        </div>
      )}

      <CardContent className="p-4 space-y-4">
        {hasBeschreibung ? (
          <p className="text-sm text-muted-foreground line-clamp-3">{beschreibungPreview}</p>
        ) : (
          <p className="text-sm text-muted-foreground/60 italic">Keine Beschreibung vorhanden</p>
        )}

        <div className="flex items-center gap-2 pt-2">
          <Button
            variant="default"
            size="sm"
            onClick={() => router.push(`/arbeitsplaetze/${arbeitsplatz.id}`)}
            className="flex-1"
          >
            <FileText className="h-4 w-4 mr-1.5" />
            Anweisungen
            <ChevronRight className="h-4 w-4 ml-auto" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => onEdit(arbeitsplatz)} className="shrink-0">
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => onDelete(arbeitsplatz.id)}
            className="shrink-0 hover:bg-red-50 hover:text-red-600 hover:border-red-200 dark:hover:bg-red-950/30"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default ArbeitsplatzCard
