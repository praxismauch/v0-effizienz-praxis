"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { AI_IMAGE_MODELS, type AIImageModel } from "@/lib/ai-image-models"
import { Zap, Clock, Sparkles, ImageIcon } from "lucide-react"

interface AIModelSelectorProps {
  value: string
  onChange: (modelId: string) => void
  filterByUseCase?: string
  disabled?: boolean
  label?: string
}

const speedIcons = {
  fast: <Zap className="h-3 w-3 text-green-500" />,
  medium: <Clock className="h-3 w-3 text-yellow-500" />,
  slow: <Clock className="h-3 w-3 text-orange-500" />,
}

const qualityColors = {
  standard: "bg-gray-100 text-gray-700",
  high: "bg-blue-100 text-blue-700",
  premium: "bg-purple-100 text-purple-700",
}

const providerIcons = {
  fal: <Sparkles className="h-3.5 w-3.5 text-purple-500" />,
  google: <ImageIcon className="h-3.5 w-3.5 text-blue-500" />,
}

const providerNames = {
  fal: "fal",
  google: "Google",
}

export function AIModelSelector({
  value,
  onChange,
  filterByUseCase,
  disabled = false,
  label = "KI-Modell",
}: AIModelSelectorProps) {
  // Filter models by use case if specified
  const models = filterByUseCase
    ? AI_IMAGE_MODELS.filter((model) =>
        model.bestFor.some((best) => best.toLowerCase().includes(filterByUseCase.toLowerCase())),
      )
    : AI_IMAGE_MODELS

  // If filter results are empty, show all models
  const displayModels = models.length > 0 ? models : AI_IMAGE_MODELS

  return (
    <div className="space-y-2">
      {label && <label className="text-sm font-medium text-muted-foreground">{label}</label>}
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Modell auswählen" />
        </SelectTrigger>
        <SelectContent>
          {displayModels.map((model) => (
            <SelectItem key={model.id} value={model.id}>
              <div className="flex items-center gap-2">
                {providerIcons[model.provider]}
                <span className="font-medium">{model.name}</span>
                {speedIcons[model.speed]}
                <Badge variant="secondary" className={`text-xs ${qualityColors[model.quality]}`}>
                  {model.quality === "premium" ? "Premium" : model.quality === "high" ? "Hoch" : "Standard"}
                </Badge>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

export function AIModelCard({
  model,
  selected,
  onSelect,
}: { model: AIImageModel; selected: boolean; onSelect: () => void }) {
  return (
    <div
      onClick={onSelect}
      className={`cursor-pointer rounded-lg border p-4 transition-all hover:shadow-md ${
        selected ? "border-primary bg-primary/5 ring-2 ring-primary" : "border-border hover:border-primary/50"
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            {providerIcons[model.provider]}
            <h3 className="font-semibold">{model.name}</h3>
            {speedIcons[model.speed]}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{model.description}</p>
          <Badge variant="outline" className="mt-2 text-xs">
            {providerNames[model.provider]}
          </Badge>
        </div>
        <Badge variant="secondary" className={qualityColors[model.quality]}>
          {model.quality === "premium" ? "Premium" : model.quality === "high" ? "Hoch" : "Standard"}
        </Badge>
      </div>
      <div className="mt-3 flex flex-wrap gap-1">
        {model.bestFor.map((useCase) => (
          <Badge key={useCase} variant="outline" className="text-xs">
            {useCase}
          </Badge>
        ))}
      </div>
    </div>
  )
}

export function AIModelGrid({
  value,
  onChange,
  filterByUseCase,
}: {
  value: string
  onChange: (modelId: string) => void
  filterByUseCase?: string
}) {
  const models = filterByUseCase
    ? AI_IMAGE_MODELS.filter((model) =>
        model.bestFor.some((best) => best.toLowerCase().includes(filterByUseCase.toLowerCase())),
      )
    : AI_IMAGE_MODELS

  const displayModels = models.length > 0 ? models : AI_IMAGE_MODELS

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {displayModels.map((model) => (
        <AIModelCard key={model.id} model={model} selected={value === model.id} onSelect={() => onChange(model.id)} />
      ))}
    </div>
  )
}
