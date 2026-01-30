import { Metadata } from "next"
import HygienePlanClient from "./page-client"

export const metadata: Metadata = {
  title: "Hygieneplan | Praxismanagement",
  description: "RKI-konforme Hygienepläne für Ihre Praxis",
}

export default function HygienePlanPage() {
  return <HygienePlanClient />
}
