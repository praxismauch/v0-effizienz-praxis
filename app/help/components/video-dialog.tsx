"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, ThumbsUp, ThumbsDown, Share2, Bookmark, Play } from "lucide-react"
import type { Video } from "../types"

interface VideoDialogProps {
  video: Video | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function VideoDialog({ video, open, onOpenChange }: VideoDialogProps) {
  if (!video) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline">{video.category}</Badge>
            <Badge variant="secondary" className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {video.duration}
            </Badge>
          </div>
          <DialogTitle className="text-2xl">{video.title}</DialogTitle>
        </DialogHeader>

        <div className="aspect-video bg-muted rounded-lg flex items-center justify-center mt-4">
          <div className="text-center">
            <div className="bg-primary/10 rounded-full p-6 inline-flex mb-4">
              <Play className="h-12 w-12 text-primary" />
            </div>
            <p className="text-muted-foreground">Video Player Placeholder</p>
            <p className="text-sm text-muted-foreground mt-1">
              In der Produktionsversion wird hier das Video abgespielt
            </p>
          </div>
        </div>

        <p className="text-muted-foreground mt-4">{video.description}</p>

        <div className="flex items-center justify-between pt-4 border-t mt-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">War dieses Video hilfreich?</span>
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
      </DialogContent>
    </Dialog>
  )
}
