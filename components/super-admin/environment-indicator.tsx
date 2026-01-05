"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Shield, ShieldAlert, Server } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export function EnvironmentIndicator() {
  const [environment, setEnvironment] = useState<string>("development")

  useEffect(() => {
    const vercelEnv = process.env.NEXT_PUBLIC_VERCEL_ENV || "development"
    setEnvironment(vercelEnv)
  }, [])

  const config = {
    production: {
      icon: ShieldAlert,
      label: "PRODUKTION",
      variant: "destructive" as const,
      color: "bg-red-500",
      tooltip: "Verbunden mit Produktionsdatenbank - Vorsicht bei Änderungen!",
    },
    preview: {
      icon: Server,
      label: "PREVIEW",
      variant: "secondary" as const,
      color: "bg-amber-500",
      tooltip: "Preview-Umgebung - Änderungen betreffen Preview-Datenbank",
    },
    development: {
      icon: Shield,
      label: "ENTWICKLUNG",
      variant: "outline" as const,
      color: "bg-green-500",
      tooltip: "Entwicklungsumgebung - Sichere Testumgebung",
    },
  }

  const current = config[environment as keyof typeof config] || config.development
  const Icon = current.icon

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${current.color} animate-pulse`} />
            <Badge variant={current.variant} className="gap-1 font-mono text-xs">
              <Icon className="h-3 w-3" />
              {current.label}
            </Badge>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{current.tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
