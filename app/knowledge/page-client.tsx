"use client"

import { AppLayout } from "@/components/app-layout"
import { KnowledgeBaseManager } from "@/components/knowledge/knowledge-base-manager"

type PageClientProps = {}

export default function PageClient(_props: PageClientProps) {
  return (
    <AppLayout>
      <KnowledgeBaseManager />
    </AppLayout>
  )
}
