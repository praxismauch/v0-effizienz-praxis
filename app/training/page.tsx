import { AppLayout } from "@/components/app-layout"
import TrainingPageClient from "./page-client"

export const metadata = {
  title: "Fortbildungsmanagement | Effizienz Praxis",
  description: "Zertifikate, Schulungen und Budgets verwalten",
}

export default function TrainingPage() {
  return (
    <AppLayout>
      <TrainingPageClient />
    </AppLayout>
  )
}
