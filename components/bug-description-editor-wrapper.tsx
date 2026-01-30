"use client"

import dynamic from "next/dynamic"
import type { ComponentProps } from "react"

const BugDescriptionEditorComponent = dynamic(
  () => import("@/components/bug-description-editor").then((mod) => ({ default: mod.BugDescriptionEditor })),
  {
    ssr: false,
    loading: () => (
      <div
        className="border rounded-lg bg-muted/30 flex items-center justify-center text-muted-foreground text-sm"
        style={{ minHeight: "200px" }}
      >
        Editor wird geladen...
      </div>
    ),
  }
)

type BugDescriptionEditorProps = ComponentProps<typeof BugDescriptionEditorComponent>

export function BugDescriptionEditor(props: BugDescriptionEditorProps) {
  return <BugDescriptionEditorComponent {...props} />
}
