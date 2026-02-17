"use client"

import { useState } from "react"
import useSWR from "swr"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
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
import { History, RotateCcw, Eye, Loader2, Clock } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"

interface VersionHistoryProps {
  articleId: string
  currentVersion: number
  onRestore?: () => void
}

interface Version {
  id: string
  article_id: string
  version: number
  version_number?: number
  title: string
  content: string
  change_summary: string | null
  created_at: string
  created_by: string | null
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function VersionHistory({ articleId, currentVersion, onRestore }: VersionHistoryProps) {
  const { toast } = useToast()
  const { data: versions, isLoading, mutate } = useSWR<Version[]>(
    articleId ? `/api/knowledge-base/${articleId}/versions` : null,
    fetcher,
  )
  const [previewVersion, setPreviewVersion] = useState<Version | null>(null)
  const [restoreVersion, setRestoreVersion] = useState<Version | null>(null)
  const [restoring, setRestoring] = useState(false)

  const handleRestore = async () => {
    if (!restoreVersion) return
    setRestoring(true)
    try {
      const res = await fetch(`/api/knowledge-base/${articleId}/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ version_id: restoreVersion.id }),
      })
      if (res.ok) {
        toast({ title: "Version wiederhergestellt", description: `Version ${restoreVersion.version || restoreVersion.version_number} wurde wiederhergestellt.` })
        mutate()
        onRestore?.()
      } else {
        throw new Error("Restore failed")
      }
    } catch {
      toast({ title: "Fehler", description: "Version konnte nicht wiederhergestellt werden.", variant: "destructive" })
    } finally {
      setRestoring(false)
      setRestoreVersion(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!versions || versions.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <History className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">Keine früheren Versionen vorhanden.</p>
          <p className="text-xs text-muted-foreground mt-1">Versionen werden bei jeder Änderung automatisch erstellt.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <History className="h-4 w-4" />
          <span>{versions.length} Version{versions.length !== 1 ? "en" : ""} gespeichert</span>
          <Badge variant="outline" className="ml-auto">
            Aktuelle Version: {currentVersion}
          </Badge>
        </div>

        <ScrollArea className="max-h-[400px]">
          <div className="space-y-2 pr-4">
            {versions.map((v) => {
              const versionNum = v.version || v.version_number || 0
              return (
                <Card key={v.id} className="border">
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="secondary" className="text-xs">
                            v{versionNum}
                          </Badge>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDate(v.created_at)}
                          </span>
                        </div>
                        <p className="text-sm font-medium truncate">{v.title}</p>
                        {v.change_summary && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{v.change_summary}</p>
                        )}
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2"
                          onClick={() => setPreviewVersion(v)}
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2"
                          onClick={() => setRestoreVersion(v)}
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </ScrollArea>
      </div>

      {/* Version Preview Dialog */}
      <Dialog open={!!previewVersion} onOpenChange={(o) => !o && setPreviewVersion(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Version {previewVersion?.version || previewVersion?.version_number} - {previewVersion?.title}</DialogTitle>
            <DialogDescription>
              Erstellt am {previewVersion ? formatDate(previewVersion.created_at) : ""}
              {previewVersion?.change_summary && ` - ${previewVersion.change_summary}`}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="flex-1 overflow-y-auto">
            <div
              className="prose prose-sm dark:prose-invert max-w-none p-4"
              dangerouslySetInnerHTML={{ __html: previewVersion?.content || "" }}
            />
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Restore Confirmation */}
      <AlertDialog open={!!restoreVersion} onOpenChange={(o) => !o && setRestoreVersion(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Version wiederherstellen?</AlertDialogTitle>
            <AlertDialogDescription>
              Moechten Sie Version {restoreVersion?.version || restoreVersion?.version_number} ({restoreVersion?.title}) wiederherstellen?
              Die aktuelle Version wird vorher gespeichert.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={restoring}>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={handleRestore} disabled={restoring}>
              {restoring ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RotateCcw className="mr-2 h-4 w-4" />}
              Wiederherstellen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
