import type { Metadata } from "next"
import ResponsibilitiesPageClient from "./page-client"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Zuständigkeiten | Effizienz Praxis",
  description: "Verwalten Sie Aufgaben und Zuständigkeiten in Ihrer Praxis.",
}

export default function ResponsibilitiesPage() {
  return <ResponsibilitiesPageClient />
}
