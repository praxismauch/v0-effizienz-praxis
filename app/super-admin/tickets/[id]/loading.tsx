export default function SuperAdminTicketDetailLoading() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center space-y-4">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent" />
        <p className="text-muted-foreground">Ticket-Details werden geladen...</p>
      </div>
    </div>
  )
}
