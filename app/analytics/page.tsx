export const dynamic = "force-dynamic"
import PageClient from "./page-client"
import { AppLayout } from "@/components/app-layout"

export default function Page() {
  return (
    <AppLayout>
      <PageClient />
    </AppLayout>
  )
}
