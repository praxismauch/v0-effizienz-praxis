"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DoorOpen, Pencil, Trash2, ImageIcon, Cpu } from "lucide-react"
import type { Room, Device } from "../room-utils"
import { getRoomColor } from "../room-utils"

interface RoomCardProps {
  room: Room
  index: number
  devices: Device[]
  onEdit: (room: Room) => void
  onDelete: (room: Room) => void
}

export function RoomCard({ room, index, devices, onEdit, onDelete }: RoomCardProps) {
  const colors = getRoomColor(room, index)

  return (
    <Card
      className={`group relative transition-all hover:shadow-md overflow-hidden ${colors.bg} ${colors.border}`}
      style={colors.hex ? { backgroundColor: `${colors.hex}10`, borderLeftColor: colors.hex } : undefined}
    >
      {room.images && room.images.length > 0 ? (
        <div className="relative aspect-video overflow-hidden">
          <img
            src={room.images[0]}
            alt={room.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {room.images.length > 1 && (
            <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full">
              +{room.images.length - 1}
            </div>
          )}
        </div>
      ) : (
        <div className="aspect-video flex items-center justify-center bg-muted/30">
          <ImageIcon className="h-10 w-10 text-muted-foreground/30" />
        </div>
      )}
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <DoorOpen className={`h-5 w-5 ${colors.icon}`} style={colors.hex ? { color: colors.hex } : undefined} />
            <CardTitle className="text-lg">{room.name}</CardTitle>
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onEdit(room)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={() => onDelete(room)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {room.beschreibung ? (
          <p className="text-sm text-muted-foreground line-clamp-2">{room.beschreibung}</p>
        ) : (
          <p className="text-sm text-muted-foreground/70 italic">Keine Beschreibung</p>
        )}
        {devices.length > 0 && (
          <div className="pt-2 border-t border-border/50">
            <Link
              href="/devices"
              className="flex items-center gap-1.5 mb-2 hover:opacity-80 transition-opacity"
              onClick={(e) => e.stopPropagation()}
            >
              <Cpu className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground underline underline-offset-2">
                Geräte ({devices.length})
              </span>
            </Link>
            <div className="flex flex-wrap gap-1.5">
              {devices.slice(0, 4).map((device) => (
                <Badge
                  key={device.id}
                  variant="secondary"
                  className="text-xs bg-background/60 hover:bg-background/80"
                >
                  {device.name}
                </Badge>
              ))}
              {devices.length > 4 && (
                <Badge variant="outline" className="text-xs">
                  +{devices.length - 4} weitere
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
