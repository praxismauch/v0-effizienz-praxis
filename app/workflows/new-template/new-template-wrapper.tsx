"use client"

import dynamic from "next/dynamic"

const NewTemplateContent = dynamic(() => import("./new-template-content"), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  ),
})

export default function NewTemplateWrapper() {
  return <NewTemplateContent />
}
