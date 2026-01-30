import type { Metadata } from "next"
import { HygienePage } from "./page-client"

export const metadata: Metadata = {
  title: "Hygieneplan | Praxis Management",
  description: "Verwalten Sie Ihre Hygienepläne nach RKI-Richtlinien",
}

export default function Page() {
  return <HygienePage />
}
