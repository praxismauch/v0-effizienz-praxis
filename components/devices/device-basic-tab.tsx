"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { X, ImageIcon } from "lucide-react"
import { isActiveMember } from "@/lib/utils/team-member-filter"
import { MultiImageUpload } from "@/components/ui/multi-image-upload"
import type { DeviceFormData, Room, Department } from "./device-form-types"
import { DEVICE_CATEGORIES } from "./device-form-types"

interface DeviceBasicTabProps {
  formData: DeviceFormData
  setFormData: (fn: (prev: DeviceFormData) => DeviceFormData) => void
  rooms: Room[]
  selectedRoomIds: string[]
  toggleRoom: (roomId: string) => void
  departments: Department[]
  teamMembers: any[]
  teamLoading: boolean
  images: string[]
  setImages: (images: string[]) => void
  practiceId: string | undefined
  loading: boolean
}

export function DeviceBasicTab({
  formData,
  setFormData,
  rooms,
  selectedRoomIds,
  toggleRoom,
  departments,
  teamMembers,
  teamLoading,
  images,
  setImages,
  practiceId,
  loading,
}: DeviceBasicTabProps) {
  const updateField = <K extends keyof DeviceFormData>(key: K, value: DeviceFormData[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="col-span-2">
        <Label>Gerätename *</Label>
        <Input
          value={formData.name}
          onChange={(e) => updateField("name", e.target.value)}
          placeholder="z.B. EKG-Gerät"
        />
      </div>
      <div className="col-span-2">
        <Label>Beschreibung</Label>
        <Textarea
          value={formData.description}
          onChange={(e) => updateField("description", e.target.value)}
          placeholder="Kurze Beschreibung des Geräts"
          rows={2}
        />
      </div>
      <div>
        <Label>Kategorie</Label>
        <Select value={formData.category} onValueChange={(value) => updateField("category", value)}>
          <SelectTrigger>
            <SelectValue placeholder="Kategorie wählen" />
          </SelectTrigger>
          <SelectContent>
            {DEVICE_CATEGORIES.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Status</Label>
        <Select value={formData.status} onValueChange={(value) => updateField("status", value)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Aktiv</SelectItem>
            <SelectItem value="maintenance">In Wartung</SelectItem>
            <SelectItem value="defect">Defekt</SelectItem>
            <SelectItem value="inactive">Inaktiv</SelectItem>
            <SelectItem value="disposed">Entsorgt</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Hersteller</Label>
        <Input
          value={formData.manufacturer}
          onChange={(e) => updateField("manufacturer", e.target.value)}
          placeholder="z.B. Philips"
        />
      </div>
      <div>
        <Label>Modell</Label>
        <Input
          value={formData.model}
          onChange={(e) => updateField("model", e.target.value)}
          placeholder="z.B. PageWriter TC70"
        />
      </div>
      <div>
        <Label>Seriennummer</Label>
        <Input
          value={formData.serial_number}
          onChange={(e) => updateField("serial_number", e.target.value)}
          placeholder="Seriennummer"
        />
      </div>
      <div>
        <Label>Inventarnummer</Label>
        <Input
          value={formData.inventory_number}
          onChange={(e) => updateField("inventory_number", e.target.value)}
          placeholder="Interne Inventarnummer"
        />
      </div>
      <div>
        <Label>Software-Version</Label>
        <Input
          value={formData.software_version}
          onChange={(e) => updateField("software_version", e.target.value)}
          placeholder="z.B. v2.4.1"
        />
      </div>
      <div>
        <Label>Abteilung</Label>
        <Select value={formData.location} onValueChange={(value) => updateField("location", value)}>
          <SelectTrigger>
            <SelectValue placeholder="Abteilung wählen" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Keine Auswahl</SelectItem>
            {departments.map((dept) => (
              <SelectItem key={dept.id} value={dept.name}>
                <div className="flex items-center gap-2">
                  {dept.color && (
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: dept.color }} />
                  )}
                  {dept.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Räume</Label>
        {selectedRoomIds.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {selectedRoomIds.map((roomId) => {
              const room = rooms.find((r) => r.id === roomId)
              return room ? (
                <Badge key={roomId} variant="secondary" className="flex items-center gap-1">
                  {room.name}
                  <button type="button" onClick={() => toggleRoom(roomId)} className="ml-1 hover:text-destructive">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ) : null
            })}
          </div>
        )}
        {rooms.length > 0 ? (
          <ScrollArea className="h-32 border rounded-md p-2">
            <div className="space-y-2">
              {rooms.map((room) => (
                <div key={room.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`room-${room.id}`}
                    checked={selectedRoomIds.includes(room.id)}
                    onCheckedChange={() => toggleRoom(room.id)}
                  />
                  <label htmlFor={`room-${room.id}`} className="text-sm cursor-pointer flex-1">
                    {room.name}
                    {room.beschreibung && (
                      <span className="text-muted-foreground ml-2 text-xs">({room.beschreibung})</span>
                    )}
                  </label>
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <p className="text-sm text-muted-foreground">
            Keine Räume verfügbar. Erstellen Sie zuerst Räume unter Räume-Verwaltung.
          </p>
        )}
      </div>
      <div className="col-span-2">
        <Label>Verantwortliche Person</Label>
        <Select
          value={formData.responsible_user_id || "none"}
          onValueChange={(value) => updateField("responsible_user_id", value === "none" ? "" : value)}
        >
          <SelectTrigger>
            <SelectValue placeholder={teamLoading ? "Laden..." : "Verantwortlichen auswählen"} />
          </SelectTrigger>
          <SelectContent position="popper" className="max-h-[300px]">
            <SelectItem value="none">Keine Auswahl</SelectItem>
            {teamMembers.filter(isActiveMember).map((member) => {
              const memberId = member.user_id || member.id
              if (!memberId) return null
              const displayName = `${member.firstName || member.first_name || ""} ${member.lastName || member.last_name || ""}`.trim() || member.email || "Unbekannt"
              return (
                <SelectItem key={memberId} value={memberId}>
                  {displayName}
                </SelectItem>
              )
            })}
            {teamMembers.filter(isActiveMember).length === 0 && !teamLoading && (
              <SelectItem value="no-members" disabled>
                Keine Teammitglieder verfügbar
              </SelectItem>
            )}
          </SelectContent>
        </Select>
      </div>
      <div className="col-span-2 space-y-2">
        <Label className="flex items-center gap-2">
          <ImageIcon className="h-4 w-4" />
          Gerätebilder
        </Label>
        <p className="text-xs text-muted-foreground">Laden Sie Bilder des Geräts hoch (max. 10 Bilder)</p>
        <MultiImageUpload
          images={images}
          onImagesChange={setImages}
          maxImages={10}
          uploadEndpoint={practiceId ? `/api/practices/${practiceId}/devices/upload-image` : ""}
          disabled={loading || !practiceId}
        />
      </div>
    </div>
  )
}
