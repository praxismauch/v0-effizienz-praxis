"use client"

import { Loader2, Brain, Wand2, CheckCircle2, ImageIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface GenerationOverlayProps {
  generatingProfile: boolean
  generatingImage: boolean
  generationStep: string
}

export function GenerationOverlay({ generatingProfile, generatingImage, generationStep }: GenerationOverlayProps) {
  if (!generatingProfile && !generatingImage) return null

  return (
    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center rounded-lg">
      <div className="flex flex-col items-center gap-4 p-8 text-center">
        <div className="relative">
          <div className="absolute inset-0 animate-ping">
            <Brain className="h-16 w-16 text-primary/30" />
          </div>
          <Brain className="h-16 w-16 text-primary animate-pulse" />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-semibold">KI generiert Wunschpatienten-Profil</h3>
          <p className="text-muted-foreground">{generationStep || "Bitte warten..."}</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Dies kann einige Sekunden dauern...</span>
        </div>
        <div className="mt-4 space-y-2 text-left w-full max-w-xs">
          <StepIndicator
            label="Eingaben analysieren"
            active={generationStep.includes("Analysiere")}
            done={!generationStep.includes("Analysiere") && generationStep !== ""}
            icon={<CheckCircle2 className="h-4 w-4" />}
          />
          <StepIndicator
            label="Persona & Strategie generieren"
            active={generationStep.includes("Persona")}
            done={generationStep.includes("Speichere") || generationStep.includes("Profilbild")}
            icon={<Wand2 className="h-4 w-4" />}
          />
          <StepIndicator
            label="Profil speichern"
            active={generationStep.includes("Speichere")}
            done={generationStep.includes("Profilbild")}
            icon={<Wand2 className="h-4 w-4" />}
          />
          <StepIndicator
            label="Profilbild generieren"
            active={generatingImage}
            done={false}
            icon={<ImageIcon className="h-4 w-4" />}
          />
        </div>
      </div>
    </div>
  )
}

function StepIndicator({
  label,
  active,
  done,
  icon,
}: {
  label: string
  active: boolean
  done: boolean
  icon: React.ReactNode
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 text-sm",
        active ? "text-primary" : done ? "text-muted-foreground" : "text-muted-foreground/50",
      )}
    >
      {active ? <Loader2 className="h-4 w-4 animate-spin" /> : done ? <CheckCircle2 className="h-4 w-4" /> : icon}
      <span>{label}</span>
    </div>
  )
}
