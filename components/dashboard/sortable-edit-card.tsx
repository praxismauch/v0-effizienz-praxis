"use client"

import type React from "react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { GripVertical, X, Columns, Rows3 } from "lucide-react"

// ── Column / Row span options ──────────────────────────────────────────────────

const SPAN_OPTIONS = [
  { value: 1, label: "1" },
  { value: 2, label: "2" },
  { value: 3, label: "3" },
  { value: 4, label: "4" },
  { value: 5, label: "Full" },
]

const ROW_SPAN_OPTIONS = [
  { value: 1, label: "1x" },
  { value: 2, label: "2x" },
  { value: 3, label: "3x" },
]

export const getSpanClass = (span: number): string => {
  switch (span) {
    case 2: return "md:col-span-2"
    case 3: return "md:col-span-3"
    case 4: return "md:col-span-4"
    case 5: return "col-span-full"
    default: return ""
  }
}

export const getRowSpanClass = (rowSpan: number): string => {
  switch (rowSpan) {
    case 2: return "md:row-span-2"
    case 3: return "md:row-span-3"
    default: return ""
  }
}

// ── Component ──────────────────────────────────────────────────────────────────

interface SortableEditWidgetProps {
  id: string
  children: React.ReactNode
  span: number
  rowSpan: number
  onRemove: () => void
  onChangeSpan: (span: number) => void
  onChangeRowSpan: (rowSpan: number) => void
  isLinebreak: boolean
}

export function SortableEditWidget({
  id,
  children,
  span,
  rowSpan,
  onRemove,
  onChangeSpan,
  onChangeRowSpan,
  isLinebreak,
}: SortableEditWidgetProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  if (isLinebreak) {
    return (
      <div ref={setNodeRef} style={style} className="col-span-full group relative">
        <div className="flex items-center gap-2 py-2">
          <div
            {...attributes}
            {...listeners}
            className="p-1 rounded hover:bg-muted cursor-grab active:cursor-grabbing touch-none"
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex-1 h-px bg-border" />
          <Badge variant="secondary" className="text-xs shrink-0">Trennlinie</Badge>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={onRemove}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div ref={setNodeRef} style={{ ...style, overflow: "visible" }} className={`${getSpanClass(span)} ${getRowSpanClass(rowSpan)} group relative`}>
      {/* Remove button */}
      <div className="absolute -top-3 -right-3 z-[100] flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button variant="destructive" size="icon" className="h-8 w-8 rounded-full shadow-lg" onClick={onRemove}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Widget content — fills most of grid cell height, leaving room for controls */}
      <div className="ring-2 ring-transparent group-hover:ring-primary/30 rounded-lg transition-all h-[calc(100%-2rem)] overflow-hidden [&>*]:h-full [&>*]:overflow-hidden">
        {children}
      </div>

      {/* Drag handle + span controls — sits below the card in the remaining space */}
      <div className="flex justify-center mt-1 z-[100] opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="flex items-center gap-1.5 bg-background border rounded-full shadow-lg px-3 py-1">
          <div {...attributes} {...listeners} className="p-1 cursor-grab active:cursor-grabbing touch-none">
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="w-px h-5 bg-border" />
          <Columns className="h-3.5 w-3.5 text-muted-foreground" />
          {SPAN_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`w-7 h-7 text-xs rounded-full font-medium transition-colors ${
                span === opt.value
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted text-muted-foreground"
              }`}
              onClick={() => onChangeSpan(opt.value)}
            >
              {opt.label}
            </button>
          ))}
          <div className="w-px h-5 bg-border" />
          <Rows3 className="h-3.5 w-3.5 text-muted-foreground" />
          {ROW_SPAN_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`w-7 h-7 text-xs rounded-full font-medium transition-colors ${
                rowSpan === opt.value
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted text-muted-foreground"
              }`}
              onClick={() => onChangeRowSpan(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
