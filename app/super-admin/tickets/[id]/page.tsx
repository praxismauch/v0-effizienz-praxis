import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import SuperAdminTicketDetail from "./page-client"
import { isSuperAdminRole } from "@/lib/auth-utils"

export async function generateMetadata({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: ticket } = await supabase.from("tickets").select("title").eq("id", params.id).maybeSingle()

  return {
    title: ticket ? `Ticket: ${ticket.title}` : "Ticket",
    description: "Super Admin Ticket Details",
  }
}

export default async function SuperAdminTicketDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = await createClient()

  // Check Super Admin Access
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    notFound()
  }

  const { data: userData } = await supabase.from("users").select("role").eq("id", user.id).maybeSingle()

  if (!isSuperAdminRole(userData?.role)) {
    notFound()
  }

  return <SuperAdminTicketDetail ticketId={params.id} />
}
