"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, ArrowLeft, ArrowRight, ThumbsUp, ThumbsDown, Share2, Bookmark } from "lucide-react"
import type { Article } from "../types"

interface ArticleDialogProps {
  article: Article | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ArticleDialog({ article, open, onOpenChange }: ArticleDialogProps) {
  if (!article) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline">{article.category}</Badge>
            <Badge variant="secondary" className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {article.readTime}
            </Badge>
          </div>
          <DialogTitle className="text-2xl">{article.title}</DialogTitle>
        </DialogHeader>

        <div className="prose prose-sm dark:prose-invert max-w-none mt-4">
          <p className="text-muted-foreground text-lg mb-6">{article.description}</p>

          <div className="bg-muted/30 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold mb-3">Inhaltsverzeichnis</h3>
            <ul className="space-y-2">
              <li className="text-primary hover:underline cursor-pointer">1. Einführung</li>
              <li className="text-primary hover:underline cursor-pointer">2. Grundlagen</li>
              <li className="text-primary hover:underline cursor-pointer">3. Schritt-für-Schritt Anleitung</li>
              <li className="text-primary hover:underline cursor-pointer">4. Häufige Fragen</li>
              <li className="text-primary hover:underline cursor-pointer">5. Zusammenfassung</li>
            </ul>
          </div>

          <h2>1. Einführung</h2>
          <p>
            In diesem Artikel erfahren Sie alles Wichtige zum Thema {article.title}. Wir führen Sie
            Schritt für Schritt durch alle relevanten Funktionen und geben Ihnen praktische Tipps für
            den Alltag.
          </p>

          <h2>2. Grundlagen</h2>
          <p>
            Bevor wir in die Details einsteigen, ist es wichtig, die Grundlagen zu verstehen. Dies
            hilft Ihnen, die folgenden Schritte besser nachzuvollziehen und das Gelernte in der Praxis
            anzuwenden.
          </p>

          <h2>3. Schritt-für-Schritt Anleitung</h2>
          <ol>
            <li>Öffnen Sie das entsprechende Modul in der Navigation</li>
            <li>Wählen Sie die gewünschte Funktion aus</li>
            <li>Folgen Sie den Anweisungen auf dem Bildschirm</li>
            <li>Bestätigen Sie Ihre Eingaben</li>
          </ol>

          <h2>4. Häufige Fragen</h2>
          <p>
            Hier finden Sie Antworten auf die häufigsten Fragen zu diesem Thema. Sollten Sie weitere
            Fragen haben, nutzen Sie gerne unseren KI-Assistenten.
          </p>

          <h2>5. Zusammenfassung</h2>
          <p>
            In diesem Artikel haben Sie gelernt, wie Sie {article.title.toLowerCase()} effektiv
            nutzen können. Wenden Sie das Gelernte direkt in Ihrer Praxis an.
          </p>
        </div>

        <div className="flex items-center justify-between pt-6 border-t mt-6">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">War dieser Artikel hilfreich?</span>
            <Button variant="ghost" size="sm">
              <ThumbsUp className="h-4 w-4 mr-1" />
              Ja
            </Button>
            <Button variant="ghost" size="sm">
              <ThumbsDown className="h-4 w-4 mr-1" />
              Nein
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm">
              <Share2 className="h-4 w-4 mr-1" />
              Teilen
            </Button>
            <Button variant="ghost" size="sm">
              <Bookmark className="h-4 w-4 mr-1" />
              Speichern
            </Button>
          </div>
        </div>

        <div className="flex justify-between pt-4 border-t">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Vorheriger Artikel
          </Button>
          <Button variant="outline" size="sm">
            Nächster Artikel
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
