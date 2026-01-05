import { Skeleton } from "@/components/ui/skeleton"
import { AppLayout } from "@/components/app-layout"
import PageHeader from "@/components/page-header"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function InventoryLoading() {
  return (
    <AppLayout>
      <PageHeader title="Material" subtitle="Prädiktive Bestandsführung und automatische Bestellvorschläge" />
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-5">
          {[...Array(5)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
