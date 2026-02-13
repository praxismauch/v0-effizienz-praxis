"use client"

import { useState } from "react"
import { useTeam } from "@/contexts/team-context"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Pencil,
  ExternalLink,
  Package,
  Phone,
  Mail,
  User,
  FileText,
  Wrench,
  ShoppingCart,
  ClipboardList,
  ImageIcon,
  MapPin,
} from "lucide-react"
import { format, parseISO, differenceInDays } from "date-fns"
import { de } from "date-fns/locale"
import { cn, parseDeviceImageUrl } from "@/lib/utils"

interface ViewDeviceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  device: any
  onEdit: () => void
  onRefresh: () => void
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  active: { label: "Aktiv", color: "bg-green-100 text-green-700" },
  maintenance: { label: "In Wartung", color: "bg-yellow-100 text-yellow-700" },
  defect: { label: "Defekt", color: "bg-red-100 text-red-700" },
  inactive: { label: "Inaktiv", color: "bg-gray-100 text-gray-700" },
  disposed: { label: "Entsorgt", color: "bg-gray-100 text-gray-500" },
}

function ViewDeviceDialog({ open, onOpenChange, device, onEdit, onRefresh }: ViewDeviceDialogProps) {
  const { teamMembers } = useTeam()
  const [activeTab, setActiveTab] = useState("overview")
  const [showImagePreview, setShowImagePreview] = useState(false)

  if (!device) return null

  const statusConfig = STATUS_CONFIG[device.status] || STATUS_CONFIG.active

  const getResponsibleName = (userId?: string) => {
    if (!userId) return "-"
    const member = teamMembers.find((m) => m.user_id === userId || m.id === userId)
    return member ? `${member.first_name} ${member.last_name}` : "-"
  }

  const formatDate = (date?: string) => {
    if (!date) return "-"
    return format(parseISO(date), "dd.MM.yyyy", { locale: de })
  }

  const getMaintenanceDaysUntil = () => {
    if (!device.next_maintenance_date) return null
    return differenceInDays(parseISO(device.next_maintenance_date), new Date())
  }

  const maintenanceDays = getMaintenanceDaysUntil()

  const firstImage = parseDeviceImageUrl(device.image_url)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              {firstImage ? (
                <button
                  type="button"
                  onClick={() => setShowImagePreview(true)}
                  className="h-16 w-16 rounded-lg overflow-hidden cursor-zoom-in hover:ring-2 hover:ring-primary/50 transition-all flex-shrink-0"
                >
                  <img
                    src={firstImage}
                    alt={device.name}
                    className="h-full w-full object-cover"
                  />
                </button>
              ) : (
                <div className="h-16 w-16 rounded-lg bg-muted flex items-center justify-center">
                  <ImageIcon className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
              <div>
                <DialogTitle className="text-xl">{device.name}</DialogTitle>
                <DialogDescription>
                  {device.manufacturer} {device.model && `- ${device.model}`}
                </DialogDescription>
                <div className="flex items-center gap-2 mt-2">
                  <Badge className={cn(statusConfig.color)}>{statusConfig.label}</Badge>
                  {device.category && <Badge variant="outline">{device.category}</Badge>}
                </div>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Pencil className="h-4 w-4 mr-2" />
              Bearbeiten
            </Button>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Übersicht</TabsTrigger>
            <TabsTrigger value="maintenance">Wartung</TabsTrigger>
            <TabsTrigger value="consumables">Verbrauch</TabsTrigger>
            <TabsTrigger value="instructions">Anleitungen</TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 pr-4">
            <TabsContent value="overview" className="mt-4 space-y-6">
              {device.description && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Beschreibung</h4>
                  <p className="text-sm">{device.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Geräteinformationen
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Seriennummer</span>
                      <span>{device.serial_number || "-"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Inventarnummer</span>
                      <span>{device.inventory_number || "-"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Standort</span>
                      <span>{device.location || "-"}</span>
                    </div>
                    <div className="flex justify-between items-start">
                      <span className="text-muted-foreground">Räume</span>
                      <div className="text-right">
                        {device.rooms && device.rooms.length > 0 ? (
                          <div className="flex flex-wrap gap-1 justify-end">
                            {device.rooms.map((room: any) => (
                              <Badge key={room.id} variant="outline" className="text-xs">
                                <MapPin className="h-3 w-3 mr-1" />
                                {room.name}
                              </Badge>
                            ))}
                          </div>
                        ) : device.room ? (
                          <span>{device.room}</span>
                        ) : (
                          <span>-</span>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Verantwortlich</span>
                      <span>{getResponsibleName(device.responsible_user_id)}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4" />
                    Kaufinformationen
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Kaufdatum</span>
                      <span>{formatDate(device.purchase_date)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Kaufpreis</span>
                      <span>
                        {device.purchase_price
                          ? `${device.purchase_price.toLocaleString("de-DE")} ${device.currency || "EUR"}`
                          : "-"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Lieferant</span>
                      <span>{device.supplier_name || "-"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Garantie bis</span>
                      <span>{formatDate(device.warranty_end_date)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {device.handbook_url && (
                <div>
                  <Button variant="outline" asChild>
                    <a href={device.handbook_url} target="_blank" rel="noopener noreferrer">
                      <FileText className="h-4 w-4 mr-2" />
                      Handbuch öffnen
                      <ExternalLink className="h-3 w-3 ml-2" />
                    </a>
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="maintenance" className="mt-4 space-y-6">
              {maintenanceDays !== null && (
                <div
                  className={cn(
                    "p-4 rounded-lg",
                    maintenanceDays < 0
                      ? "bg-red-50 border border-red-200"
                      : maintenanceDays <= 30
                        ? "bg-yellow-50 border border-yellow-200"
                        : "bg-green-50 border border-green-200",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Wrench
                      className={cn(
                        "h-5 w-5",
                        maintenanceDays < 0
                          ? "text-red-600"
                          : maintenanceDays <= 30
                            ? "text-yellow-600"
                            : "text-green-600",
                      )}
                    />
                    <div>
                      <p className="font-medium">
                        {maintenanceDays < 0
                          ? `Wartung überfällig (seit ${Math.abs(maintenanceDays)} Tagen)`
                          : maintenanceDays === 0
                            ? "Wartung heute fällig"
                            : `Nächste Wartung in ${maintenanceDays} Tagen`}
                      </p>
                      <p className="text-sm text-muted-foreground">{formatDate(device.next_maintenance_date)}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <h4 className="font-medium">Wartungsdetails</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Wartungsintervall</span>
                    <span>{device.maintenance_interval_days ? `${device.maintenance_interval_days} Tage` : "-"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Letzte Wartung</span>
                    <span>{formatDate(device.last_maintenance_date)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Nächste Wartung</span>
                    <span>{formatDate(device.next_maintenance_date)}</span>
                  </div>
                </div>
              </div>

              {device.maintenance_service_partner && (
                <div className="space-y-4">
                  <h4 className="font-medium">Servicepartner</h4>
                  <div className="p-4 bg-muted rounded-lg space-y-2">
                    <p className="font-medium">{device.maintenance_service_partner}</p>
                    {device.maintenance_service_contact && (
                      <p className="text-sm flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {device.maintenance_service_contact}
                      </p>
                    )}
                    {device.maintenance_service_phone && (
                      <p className="text-sm flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        <a href={`tel:${device.maintenance_service_phone}`} className="hover:underline">
                          {device.maintenance_service_phone}
                        </a>
                      </p>
                    )}
                    {device.maintenance_service_email && (
                      <p className="text-sm flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        <a href={`mailto:${device.maintenance_service_email}`} className="hover:underline">
                          {device.maintenance_service_email}
                        </a>
                      </p>
                    )}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="consumables" className="mt-4 space-y-6">
              {device.consumables_supplier || device.consumables_order_url || device.consumables_notes ? (
                <>
                  {device.consumables_supplier && (
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">Lieferant</h4>
                      <p>{device.consumables_supplier}</p>
                    </div>
                  )}

                  {device.consumables_order_url && (
                    <div>
                      <Button variant="outline" asChild>
                        <a href={device.consumables_order_url} target="_blank" rel="noopener noreferrer">
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          Zur Bestellseite
                          <ExternalLink className="h-3 w-3 ml-2" />
                        </a>
                      </Button>
                    </div>
                  )}

                  {device.consumables_notes && (
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">Hinweise</h4>
                      <p className="text-sm whitespace-pre-wrap">{device.consumables_notes}</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Keine Verbrauchsmaterial-Informationen hinterlegt</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="instructions" className="mt-4 space-y-6">
              {device.short_sop && (
                <div>
                  <h4 className="font-medium flex items-center gap-2 mb-2">
                    <ClipboardList className="h-4 w-4" />
                    Kurze Bedienungsanleitung (SOP)
                  </h4>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm whitespace-pre-wrap">{device.short_sop}</p>
                  </div>
                </div>
              )}

              {device.cleaning_instructions && (
                <div>
                  <h4 className="font-medium mb-2">Reinigungsanleitung</h4>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm whitespace-pre-wrap">{device.cleaning_instructions}</p>
                  </div>
                </div>
              )}

              {device.maintenance_instructions && (
                <div>
                  <h4 className="font-medium mb-2">Wartungsanleitung</h4>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm whitespace-pre-wrap">{device.maintenance_instructions}</p>
                  </div>
                </div>
              )}

              {!device.short_sop && !device.cleaning_instructions && !device.maintenance_instructions && (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Keine Anleitungen hinterlegt</p>
                </div>
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>

      {/* Full image preview overlay */}
      {showImagePreview && firstImage && (
        <div
          className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center cursor-zoom-out"
          onClick={() => setShowImagePreview(false)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === "Escape") setShowImagePreview(false) }}
        >
          <img
            src={firstImage}
            alt={device.name}
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl"
            crossOrigin="anonymous"
          />
        </div>
      )}
    </Dialog>
  )
}

export { ViewDeviceDialog }
export default ViewDeviceDialog
