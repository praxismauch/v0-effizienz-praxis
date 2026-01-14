import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    const supabase = await createClient()

    const { data: responsibilities, error: responsibilitiesError } = await supabase
      .from("responsibilities")
      .select("*")
      .eq("practice_id", practiceId)

    if (responsibilitiesError) {
      console.error("Error fetching responsibilities:", responsibilitiesError)
    }

    const { data: orgPositions, error: orgError } = await supabase
      .from("org_chart_positions")
      .select("*")
      .eq("practice_id", practiceId)

    if (orgError) {
      console.error("Error fetching org positions:", orgError)
    }

    const { data: departments, error: deptError } = await supabase
      .from("departments")
      .select("*")
      .eq("practice_id", practiceId)
      .order("display_order") // Changed sort_order to display_order to match actual column name

    if (deptError) {
      console.error("Error fetching departments:", deptError)
    }

    const { data: teamMembers, error: membersError } = await supabase
      .from("team_members")
      .select("*, users(*)") // Removed contracts(*) selection as relationship doesn't exist
      .eq("practice_id", practiceId)
      .eq("status", "active")

    if (membersError) {
      return NextResponse.json({ error: membersError.message }, { status: 500 })
    }

    const { data: teams, error: teamsError } = await supabase
      .from("teams")
      .select("*")
      .eq("practice_id", practiceId)
      .eq("is_active", true)

    if (teamsError) {
      return NextResponse.json({ error: teamsError.message }, { status: 500 })
    }

    const { data: staffingPlans, error: plansError } = await supabase
      .from("staffing_plans")
      .select("*, staffing_plan(*)")
      .eq("practice_id", practiceId)
      .eq("is_active", true)

    if (plansError) {
      return NextResponse.json({ error: plansError.message }, { status: 500 })
    }

    const teamAnalysisData = {
      totalMembers: teamMembers?.length || 0,
      roleDistribution: teamMembers?.reduce((acc: any, member: any) => {
        const role = member.role || "unknown"
        acc[role] = (acc[role] || 0) + 1
        return acc
      }, {}),
      teamDistribution: teams?.map((team: any) => ({
        name: team.name,
        memberCount: teamMembers?.filter((m: any) => m.user_id && team.id).length || 0,
      })),
      staffingPlansCount: staffingPlans?.length || 0, // Removed contracts data since relationship doesn't exist
      avgAge: calculateAverageAge(teamMembers),
      responsibilities: {
        total: responsibilities?.length || 0,
        byGroup: responsibilities?.reduce((acc: any, resp: any) => {
          const group = resp.group_name || "Ungrouped"
          acc[group] = (acc[group] || 0) + 1
          return acc
        }, {}),
        withMembers: responsibilities?.filter((r: any) => r.team_member_ids?.length > 0).length || 0,
      },
      orgChart: {
        totalPositions: orgPositions?.length || 0,
        vacantPositions: orgPositions?.filter((p: any) => !p.user_id).length || 0,
        hierarchyLevels: orgPositions?.reduce((acc: any, pos: any) => {
          const level = pos.level || 0
          acc[level] = (acc[level] || 0) + 1
          return acc
        }, {}),
      },
      departments: {
        total: departments?.length || 0,
        list: departments?.map((d: any) => d.name) || [],
      },
    }

    const { text: analysis } = await generateText({
      model: "openai/gpt-4o",
      prompt: `Du bist ein HR-Experte für medizinische Praxen. Analysiere das folgende Team und gib Empfehlungen:

Team Daten:
- Gesamt Mitarbeiter: ${teamAnalysisData.totalMembers}
- Rollen Verteilung: ${JSON.stringify(teamAnalysisData.roleDistribution, null, 2)}
- Team Verteilung: ${JSON.stringify(teamAnalysisData.teamDistribution, null, 2)}
- Durchschnittsalter: ${teamAnalysisData.avgAge || "nicht verfügbar"}
- Bedarfspläne: ${teamAnalysisData.staffingPlansCount}

Verantwortlichkeiten:
- Gesamt: ${teamAnalysisData.responsibilities.total}
- Nach Gruppe: ${JSON.stringify(teamAnalysisData.responsibilities.byGroup, null, 2)}
- Mit zugewiesenen Mitarbeitern: ${teamAnalysisData.responsibilities.withMembers}

Organisationsstruktur:
- Gesamt Positionen: ${teamAnalysisData.orgChart.totalPositions}
- Offene Stellen: ${teamAnalysisData.orgChart.vacantPositions}
- Hierarchieebenen: ${JSON.stringify(teamAnalysisData.orgChart.hierarchyLevels, null, 2)}

Abteilungen:
- Gesamt: ${teamAnalysisData.departments.total}
- Liste: ${teamAnalysisData.departments.list.join(", ")}

Bitte analysiere:
1. Team-Zusammensetzung und Rollenverteilung
2. Verantwortlichkeiten und deren Zuordnung
3. Organisationsstruktur und Hierarchie
4. Offene Positionen und Personalbedarf
5. Abteilungsverteilung
6. Potenzielle Engpässe oder Überbesetzungen
7. Altersstruktur und Nachfolgeplanung

Gib konkrete, umsetzbare Empfehlungen in folgenden Kategorien:
- Sofortmaßnahmen (dringend)
- Mittelfristige Maßnahmen (1-3 Monate)
- Langfristige Strategien (3-12 Monate)
- Personalplanung
- Team-Entwicklung
- Risikomanagement
- Optimierungspotenziale

Antworte auf Deutsch in einem strukturierten Format mit klaren Überschriften und Bullet Points.`,
    })

    return NextResponse.json({
      analysis,
      statistics: teamAnalysisData,
    })
  } catch (error: any) {
    console.error("AI team analysis error:", error)
    return NextResponse.json({ error: "Fehler bei der Team-Analyse", details: error.message }, { status: 500 })
  }
}

function calculateAverageAge(teamMembers: any[]): number | null {
  if (!teamMembers || teamMembers.length === 0) return null

  const membersWithAge = teamMembers.filter((member: any) => member.users?.date_of_birth)

  if (membersWithAge.length === 0) return null

  const today = new Date()
  const ages = membersWithAge.map((member: any) => {
    const birthDate = new Date(member.users.date_of_birth)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  })

  return Math.round(ages.reduce((sum, age) => sum + age, 0) / ages.length)
}
