"use client"

import { Play, Eye } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { VideoTutorial } from "../types"

interface VideosTabProps {
  videos: VideoTutorial[]
  onSelectVideo: (video: VideoTutorial) => void
}

export function VideosTab({ videos, onSelectVideo }: VideosTabProps) {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {videos.map((video) => (
        <Card
          key={video.id}
          className="overflow-hidden cursor-pointer hover:shadow-lg transition-all group"
          onClick={() => onSelectVideo(video)}
        >
          <div className="relative aspect-video bg-muted">
            <img
              src={video.thumbnail || "/placeholder.svg"}
              alt={video.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center">
                <Play className="h-8 w-8 text-primary ml-1" />
              </div>
            </div>
            <Badge className="absolute bottom-2 right-2 bg-black/70 text-white">{video.duration}</Badge>
          </div>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors line-clamp-2">
              {video.title}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{video.description}</p>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                {video.views.toLocaleString()} Aufrufe
              </span>
              <span>{video.chapters.length} Kapitel</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
