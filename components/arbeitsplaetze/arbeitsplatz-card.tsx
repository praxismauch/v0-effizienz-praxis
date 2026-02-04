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

export type ArbeitsplatzColor = "green" | "blue" | "purple" | "orange" | "red" | "teal" | "pink" | "yellow"

export const ARBEITSPLATZ_COLORS: { value: ArbeitsplatzColor; label: string; bg: string; icon: string; border: string; gradient: string }[] = [
  { value: "green", label: "Grün", bg: "bg-green-100 dark:bg-green-900/30", icon: "text-green-600 dark:text-green-400", border: "border-t-green-500", gradient: "bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30" },
  { value: "blue", label: "Blau", bg: "bg-blue-100 dark:bg-blue-900/30", icon: "text-blue-600 dark:text-blue-400", border: "border-t-blue-500", gradient: "bg-gradient-to-r from-blue-50 to-sky-50 dark:from-blue-950/30 dark:to-sky-950/30" },
  { value: "purple", label: "Lila", bg: "bg-purple-100 dark:bg-purple-900/30", icon: "text-purple-600 dark:text-purple-400", border: "border-t-purple-500", gradient: "bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-950/30 dark:to-violet-950/30" },
  { value: "orange", label: "Orange", bg: "bg-orange-100 dark:bg-orange-900/30", icon: "text-orange-600 dark:text-orange-400", border: "border-t-orange-500", gradient: "bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30" },
  { value: "red", label: "Rot", bg: "bg-red-100 dark:bg-red-900/30", icon: "text-red-600 dark:text-red-400", border: "border-t-red-500", gradient: "bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/30" },
  { value: "teal", label: "Türkis", bg: "bg-teal-100 dark:bg-teal-900/30", icon: "text-teal-600 dark:text-teal-400", border: "border-t-teal-500", gradient: "bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-950/30 dark:to-cyan-950/30" },
  { value: "pink", label: "Pink", bg: "bg-pink-100 dark:bg-pink-900/30", icon: "text-pink-600 dark:text-pink-400", border: "border-t-pink-500", gradient: "bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-950/30 dark:to-rose-950/30" },
  { value: "yellow", label: "Gelb", bg: "bg-yellow-100 dark:bg-yellow-900/30", icon: "text-yellow-600 dark:text-yellow-400", border: "border-t-yellow-500", gradient: "bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-950/30 dark:to-amber-950/30" },
]

export function getColorConfig(color: ArbeitsplatzColor | string | null | undefined) {
  return ARBEITSPLATZ_COLORS.find(c => c.value === color) || ARBEITSPLATZ_COLORS[0]
}

interface Arbeitsplatz {
  id: string
  name: string
  beschreibung: string | null
  raum_id: string | null
  is_active: boolean
  room?: Room | null
  image_url?: string | null
  color?: ArbeitsplatzColor | null
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
  const colorConfig = getColorConfig(arbeitsplatz.color)

  const beschreibungPreview = stripHtml(arbeitsplatz.beschreibung)
  const hasBeschreibung = !isHtmlEmpty(arbeitsplatz.beschreibung)

  if (viewMode === "list") {
    return (
      <Card className="group hover:shadow-md transition-shadow">
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
                  arbeitsplatz.is_active ? colorConfig.bg : "bg-gray-100 dark:bg-gray-800",
                )}
              >
                <Monitor
                  className={cn(
                    "h-5 w-5",
                    arbeitsplatz.is_active ? colorConfig.icon : "text-gray-500",
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
              <Button variant="ghost" size="sm" onClick={() => router.push(`/arbeitsplaetze/${arbeitsplatz.id}`)} className="text-muted-foreground hover:text-foreground">
                <FileText className="h-4 w-4 mr-1" />
                Anweisungen
              </Button>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <Button variant="ghost" size="icon" onClick={() => onEdit(arbeitsplatz)} className="h-8 w-8">
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => onDelete(arbeitsplatz.id)} className="h-8 w-8 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
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
              ? colorConfig.gradient
              : "bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-900/30 dark:to-slate-900/30",
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  "p-2.5 rounded-xl shrink-0",
                  arbeitsplatz.is_active ? colorConfig.bg : "bg-gray-100 dark:bg-gray-800",
                )}
              >
                <Monitor
                  className={cn(
                    "h-5 w-5",
                    arbeitsplatz.is_active ? colorConfig.icon : "text-gray-500",
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
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/arbeitsplaetze/${arbeitsplatz.id}`)}
            className="flex-1 text-muted-foreground hover:text-foreground"
          >
            <FileText className="h-4 w-4 mr-1.5" />
            Anweisungen
            <ChevronRight className="h-4 w-4 ml-auto" />
          </Button>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <Button variant="ghost" size="icon" onClick={() => onEdit(arbeitsplatz)} className="shrink-0 h-8 w-8">
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(arbeitsplatz.id)}
              className="shrink-0 h-8 w-8 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default ArbeitsplatzCard
