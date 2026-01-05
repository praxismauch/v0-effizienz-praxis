"use client"
import dynamic from "next/dynamic"
import { Suspense } from "react"

const NewJobPostingContent = dynamic(() => import("./new-job-posting-content"), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  ),
})

export default function NewJobPostingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      }
    >
      <NewJobPostingContent />
    </Suspense>
  )
}
