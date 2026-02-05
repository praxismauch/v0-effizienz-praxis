export const dynamic = "force-dynamic"

import { redirect, notFound } from "next/navigation"
import { getCurrentUser, getCurrentPracticeId } from "@/lib/server/get-current-user"
import { createServerClient } from "@/lib/server/supabase"

export default async function TeamMemberDetailPage({ params }: { params: { id: string } }) {
  console.log("[v0] Team member detail page accessed with ID:", params.id)
  
  // Fetch user and practice data server-side
  const [user, practiceId] = await Promise.all([
    getCurrentUser(),
    getCurrentPracticeId(),
  ])
  
  console.log("[v0] Team member detail - user:", user?.id, "practiceId:", practiceId)
  
  // Redirect if not authenticated
  if (!user) {
    console.log("[v0] No user, redirecting to login")
    redirect("/auth/login")
  }
  
  if (!practiceId) {
    console.log("[v0] No practiceId, redirecting to dashboard")
    redirect("/dashboard")
  }
  
  // Fetch team member data directly
  console.log("[v0] About to fetch team member:", params.id, "for practice:", practiceId)
  const supabase = await createServerClient()
  const practiceIdInt = parseInt(practiceId, 10)
  
  const { data: teamMember, error } = await supabase
    .from("team_members")
    .select("*")
    .eq("id", params.id)
    .eq("practice_id", practiceIdInt)
    .single()
  
  console.log("[v0] Team member fetch result:", teamMember ? "Found" : "NOT FOUND", error ? `Error: ${error.message}` : "")
  
  // If team member not found, show 404
  if (!teamMember || error) {
    console.log("[v0] Calling notFound() for member ID:", params.id)
    notFound()
  }
  
  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <a href="/team" className="text-sm text-blue-600 hover:underline">
            ← Zurück zur Teamübersicht
          </a>
        </div>
        
        <h1 className="text-3xl font-bold">Teammitglied Details</h1>
        
        <div className="bg-white rounded-lg border p-6 space-y-4">
          <h2 className="text-xl font-semibold">{teamMember.name || teamMember.email || "Teammitglied"}</h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">E-Mail</p>
              <p className="font-medium">{teamMember.email || "—"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Rolle</p>
              <p className="font-medium">{teamMember.role || "—"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Abteilung</p>
              <p className="font-medium">{teamMember.department || "—"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <p className="font-medium">{teamMember.status || "Aktiv"}</p>
            </div>
          </div>
          
          <div className="pt-4">
            <a 
              href={`/team/${params.id}/edit`}
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Bearbeiten
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
