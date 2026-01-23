"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ClipboardList, Plus } from "lucide-react"
import Link from "next/link"
import type { Responsibility } from "../types"

interface ResponsibilitiesTabProps {
  responsibilities: Responsibility[]
  isAdmin: boolean
}

export default function ResponsibilitiesTab({ responsibilities, isAdmin }: ResponsibilitiesTabProps) {
  // Group responsibilities by category/group
  const groupedResponsibilities = responsibilities.reduce(
    (acc, resp) => {
      const group = resp.group_name || resp.category || "Sonstige"
      if (!acc[group]) acc[group] = []
      acc[group].push(resp)
      return acc
    },
    {} as Record<string, Responsibility[]>
  )

  if (responsibilities.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <ClipboardList className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg font-medium text-muted-foreground">Keine Zuständigkeiten definiert</p>
          <p className="text-sm text-muted-foreground mt-1">
            Definieren Sie Zuständigkeiten für Ihr Team
          </p>
          {isAdmin && (
            <Button className="mt-4" asChild>
              <Link href="/responsibilities">
                <Plus className="h-4 w-4 mr-2" />
                Zuständigkeiten verwalten
              </Link>
            </Button>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Zuständigkeiten</h3>
          <p className="text-sm text-muted-foreground">
            {responsibilities.length} Zuständigkeiten definiert
          </p>
        </div>
        {isAdmin && (
          <Button asChild>
            <Link href="/responsibilities">
              Alle verwalten
            </Link>
          </Button>
        )}
      </div>

      {Object.entries(groupedResponsibilities).map(([group, items]) => (
        <Card key={group}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{group}</CardTitle>
            <CardDescription>{items.length} Zuständigkeit(en)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {items.slice(0, 5).map((resp) => (
                <div
                  key={resp.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{resp.name}</p>
                    {resp.responsible_user_name && (
                      <p className="text-sm text-muted-foreground">
                        Verantwortlich: {resp.responsible_user_name}
                      </p>
                    )}
                  </div>
                  {resp.is_active && (
                    <Badge variant="outline" className="ml-2">
                      Aktiv
                    </Badge>
                  )}
                </div>
              ))}
              {items.length > 5 && (
                <p className="text-sm text-muted-foreground text-center">
                  +{items.length - 5} weitere
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
