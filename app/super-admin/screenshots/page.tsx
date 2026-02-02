import { Metadata } from "next"
import { ScreenshotsPageClient } from "./page-client"

export const metadata: Metadata = {
  title: "Screenshots | Super Admin",
  description: "Generiere automatische Screenshots aller UI-Komponenten",
}

export default function ScreenshotsPage() {
  return <ScreenshotsPageClient />
}
