"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Calendar, CheckCircle, Wrench } from "lucide-react"
import { format, differenceInDays, parseISO } from "date-fns"
import { de } from "date-fns/locale"
import type { MedicalDevice } from "../types"

interface MaintenanceTabProps {
  devicesOverdue: MedicalDevice[]
  devicesWithMaintenanceDue: MedicalDevice[]
  onDeviceClick: (device: MedicalDevice) => void
}

export function MaintenanceTab({ devicesOverdue, devicesWithMaintenanceDue, onDeviceClick }: MaintenanceTabProps) {
  return (
    <div className="space-y-4">
      {devicesOverdue.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-red-700 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Überfällige Wartungen ({devicesOverdue.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {devicesOverdue.map((device) => (
                <div
                  key={device.id}
                  className="flex items-center justify-between p-3 bg-white rounded-lg cursor-pointer hover:bg-gray-50"
                  onClick={() => onDeviceClick(device)}
                >
                  <div>
                    <p className="font-medium">{device.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Fällig seit:{" "}
                      {device.next_maintenance_date &&
                        format(parseISO(device.next_maintenance_date), "dd.MM.yyyy", { locale: de })}
                    </p>
                  </div>
                  <Button size="sm" variant="destructive">
                    <Wrench className="h-4 w-4 mr-2" />
                    Wartung dokumentieren
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {devicesWithMaintenanceDue.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-yellow-700 flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Anstehende Wartungen ({devicesWithMaintenanceDue.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {devicesWithMaintenanceDue.map((device) => {
                const daysUntil = differenceInDays(parseISO(device.next_maintenance_date!), new Date())
                return (
                  <div
                    key={device.id}
                    className="flex items-center justify-between p-3 bg-white rounded-lg cursor-pointer hover:bg-gray-50"
                    onClick={() => onDeviceClick(device)}
                  >
                    <div>
                      <p className="font-medium">{device.name}</p>
                      <p className="text-sm text-muted-foreground">
                        In {daysUntil} Tagen (
                        {format(parseISO(device.next_maintenance_date!), "dd.MM.yyyy", { locale: de })})
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {device.maintenance_service_partner && (
                        <span className="text-sm text-muted-foreground">{device.maintenance_service_partner}</span>
                      )}
                      <Button size="sm" variant="outline">
                        <Calendar className="h-4 w-4 mr-2" />
                        Termin planen
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {devicesOverdue.length === 0 && devicesWithMaintenanceDue.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
            <h3 className="text-lg font-medium mb-2">Alles auf dem neuesten Stand</h3>
            <p className="text-muted-foreground text-center">
              Keine anstehenden oder überfälligen Wartungen in den nächsten 30 Tagen.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
