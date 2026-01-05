"use client"

import { useEffect, useState } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { ShieldAlert, ShieldCheck, AlertTriangle } from "lucide-react"

interface EnvironmentInfo {
  environment: "production" | "preview" | "development"
  databaseUrl: string
  isProduction: boolean
  requiresConfirmation: boolean
}

export function DatabaseProtectionBanner() {
  const [envInfo, setEnvInfo] = useState<EnvironmentInfo | null>(null)

  useEffect(() => {
    // Get environment info from client-side env vars
    const vercelEnv = process.env.NEXT_PUBLIC_VERCEL_ENV
    const isProduction = vercelEnv === "production"

    setEnvInfo({
      environment: (vercelEnv as "production" | "preview" | "development") || "development",
      databaseUrl: "***hidden***",
      isProduction,
      requiresConfirmation: isProduction,
    })
  }, [])

  if (!envInfo) return null

  if (envInfo.isProduction) {
    return (
      <Alert variant="destructive" className="mb-4 border-red-500 bg-red-500/10">
        <ShieldAlert className="h-5 w-5" />
        <AlertTitle className="flex items-center gap-2">
          <span>PRODUKTIONS-DATENBANK</span>
          <Badge variant="destructive" className="animate-pulse">
            LIVE
          </Badge>
        </AlertTitle>
        <AlertDescription className="mt-2">
          <p className="font-medium">Sie sind mit der Produktionsdatenbank verbunden!</p>
          <ul className="mt-2 list-disc list-inside text-sm space-y-1">
            <li>Destruktive Operationen (DROP, TRUNCATE, DELETE ohne WHERE) sind blockiert</li>
            <li>Alle Änderungen betreffen echte Benutzerdaten</li>
            <li>Scripts werden vor der Ausführung validiert</li>
            <li>Ein Backup wird automatisch vor kritischen Änderungen erstellt</li>
          </ul>
        </AlertDescription>
      </Alert>
    )
  }

  if (envInfo.environment === "preview") {
    return (
      <Alert className="mb-4 border-amber-500 bg-amber-500/10">
        <AlertTriangle className="h-5 w-5 text-amber-500" />
        <AlertTitle className="flex items-center gap-2">
          <span>Preview-Umgebung</span>
          <Badge variant="outline" className="border-amber-500 text-amber-500">
            PREVIEW
          </Badge>
        </AlertTitle>
        <AlertDescription className="text-sm">
          Sie arbeiten in einer Preview-Umgebung. Änderungen können die Preview-Datenbank betreffen.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Alert className="mb-4 border-green-500 bg-green-500/10">
      <ShieldCheck className="h-5 w-5 text-green-500" />
      <AlertTitle className="flex items-center gap-2">
        <span>Entwicklungsumgebung</span>
        <Badge variant="outline" className="border-green-500 text-green-500">
          DEV
        </Badge>
      </AlertTitle>
      <AlertDescription className="text-sm">
        Sie arbeiten in der Entwicklungsumgebung. Änderungen betreffen nur die Entwicklungsdatenbank.
      </AlertDescription>
    </Alert>
  )
}
