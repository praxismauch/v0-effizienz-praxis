import { AppLayout } from "@/components/app-layout"

export default function Loading() {
  return <AppLayout loading={true} loadingMessage="Kommunikation wird geladen..." />
}
