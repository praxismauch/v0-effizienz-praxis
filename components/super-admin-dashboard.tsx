"use client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SystemOptimizationReport } from "@/components/system-optimization-report"
import { LazyTicketManagement } from "@/components/lazy-components"

// Define the props interface for SuperAdminDashboard

// Use LazyTicketManagement instead of direct TicketManagement
const SuperAdminDashboard = ({ user, activeTab }: { user: any; activeTab?: string }) => {
  return (
    <div>
      <h1>Super Admin Dashboard</h1>
      <SystemOptimizationReport />
      {/* Tickets Tab Content */}
      <Tabs defaultValue={activeTab}>
        <TabsList>
          <TabsTrigger value="tickets">Tickets</TabsTrigger>
          {/* Additional tabs can be added here */}
        </TabsList>
        <TabsContent value="tickets" className="space-y-6">
          <LazyTicketManagement />
        </TabsContent>
      </Tabs>
      {/* rest of code here */}
      {/* Additional components and logic can be added here */}
    </div>
  )
}

export { SuperAdminDashboard }
export default SuperAdminDashboard
