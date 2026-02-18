import type { Metadata } from "next"
import SchwarzesBrettClient from "./page-client"

export const metadata: Metadata = {
  title: "Schwarzes Brett",
  description: "Digitales Schwarzes Brett der Praxis - Ankündigungen, Hinweise und wichtige Mitteilungen für das Team.",
}

export default function SchwarzesBrettPage() {
  return <SchwarzesBrettClient />
}
