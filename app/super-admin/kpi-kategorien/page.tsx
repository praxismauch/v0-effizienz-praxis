import KpiKategorienClient from "./page-client"

export const metadata = {
  title: "KPI-Kategorien | Super Admin",
  description: "Verwalten Sie globale KPI-Kategorien und Kennzahlen für alle Praxen",
}

export default function KpiKategorienPage() {
  return <KpiKategorienClient />
}
