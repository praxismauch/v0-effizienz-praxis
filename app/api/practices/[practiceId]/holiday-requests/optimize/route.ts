import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { generateText } from "ai"

export const maxDuration = 60

// POST - AI-powered holiday schedule optimization
export async function POST(request: Request, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    const supabase = await createClient()
    const body = await request.json()
    const { year } = body

    const targetYear = year || new Date().getFullYear()

    // Fetch all data needed for optimization
    const [requestsRes, teamMembersRes, contractsRes, blockedPeriodsRes, bankHolidaysRes] = await Promise.all([
      supabase
        .from("holiday_requests")
        .select("*")
        .eq("practice_id", practiceId)
        .is("deleted_at", null)
        .gte("start_date", `${targetYear}-01-01`)
        .lte("end_date", `${targetYear}-12-31`),
      supabase
        .from("team_members")
        .select("id, first_name, last_name, user_id")
        .eq("practice_id", practiceId)
        .eq("status", "active"),
      supabase
        .from("contracts")
        .select("team_member_id, holiday_days_fulltime, working_days_fulltime, hours_per_week, is_active")
        .eq("practice_id", practiceId)
        .eq("is_active", true)
        .is("deleted_at", null),
      supabase.from("holiday_blocked_periods").select("*").eq("practice_id", practiceId).is("deleted_at", null),
      supabase.from("holidays").select("*").eq("practice_id", practiceId).is("deleted_at", null),
    ])

    const requests = requestsRes.data || []
    const teamMembers = teamMembersRes.data || []
    const contracts = contractsRes.data || []
    const blockedPeriods = blockedPeriodsRes.data || []
    const bankHolidays = bankHolidaysRes.data || []

    // Calculate holiday entitlement for each team member
    const memberEntitlements = teamMembers.map((member: any) => {
      const contract = contracts.find((c: any) => c.team_member_id === member.id)
      const fullTimeHours = 40
      const workingDaysFulltime = contract?.working_days_fulltime || 5
      const holidayDaysFulltime = contract?.holiday_days_fulltime || 30
      const hoursPerWeek = contract?.hours_per_week || fullTimeHours

      // Formula: =AUFRUNDEN(C1 / A1 * B1; 0)
      // C1 = Working days part-time (calculated from hours)
      // A1 = Working days fulltime
      // B1 = Holiday days fulltime
      const workingDaysPartTime = (hoursPerWeek / fullTimeHours) * workingDaysFulltime
      const holidayEntitlement = Math.ceil((workingDaysPartTime / workingDaysFulltime) * holidayDaysFulltime)

      const memberRequests = requests.filter((r: any) => r.user_id === member.id || r.user_id === member.user_id)
      const usedDays = memberRequests
        .filter((r: any) => ["approved", "requested"].includes(r.status))
        .reduce((sum: number, r: any) => sum + (r.days_count || 0), 0)

      const wishedDays = memberRequests
        .filter((r: any) => r.status === "wish")
        .reduce((sum: number, r: any) => sum + (r.days_count || 0), 0)

      return {
        id: member.id,
        name: `${member.first_name} ${member.last_name}`,
        entitlement: holidayEntitlement,
        used: usedDays,
        wished: wishedDays,
        remaining: holidayEntitlement - usedDays,
      }
    })

    // Prepare context for AI
    const wishRequests = requests.filter((r: any) => r.status === "wish")

    if (wishRequests.length === 0) {
      return NextResponse.json({
        message: "Keine Urlaubswünsche zum Optimieren vorhanden",
        suggestions: [],
      })
    }

    // Map requests to member names for the prompt
    const getRequestMemberName = (r: any) => {
      const member = teamMembers.find((m: any) => m.id === r.user_id || m.user_id === r.user_id)
      return member ? `${member.first_name} ${member.last_name}` : "Unbekannt"
    }

    const prompt = `Du bist ein KI-Assistent für Urlaubsplanung in einer medizinischen Praxis.

Analysiere die folgenden Urlaubswünsche und erstelle einen optimalen Urlaubsplan.

TEAM-MITGLIEDER UND URLAUBSANSPRUCH:
${memberEntitlements.map((m: any) => `- ${m.name}: ${m.entitlement} Tage Anspruch, ${m.used} genommen, ${m.wished} gewünscht, ${m.remaining} verbleibend`).join("\n")}

URLAUBSWÜNSCHE:
${wishRequests
  .map(
    (r: any) =>
      `- ${getRequestMemberName(r)}: ${r.start_date} bis ${r.end_date} (${r.days_count} Tage, Priorität: ${r.priority}/5)${r.reason ? `, Grund: ${r.reason}` : ""}`,
  )
  .join("\n")}

GESPERRTE ZEITRÄUME:
${blockedPeriods.length > 0 ? blockedPeriods.map((b: any) => `- ${b.name}: ${b.start_date} bis ${b.end_date}${b.reason ? ` (${b.reason})` : ""}`).join("\n") : "Keine gesperrten Zeiträume"}

FEIERTAGE:
${bankHolidays.length > 0 ? bankHolidays.map((h: any) => `- ${h.name}: ${h.holiday_date}`).join("\n") : "Keine Feiertage definiert"}

REGELN:
1. Maximal 30% des Teams sollte gleichzeitig im Urlaub sein
2. Hochpriorisierte Wünsche (4-5) sollten bevorzugt werden
3. Gesperrte Zeiträume müssen respektiert werden
4. Feiertage können für Brückentage genutzt werden
5. Jeder sollte seinen vollen Urlaubsanspruch nutzen können

Erstelle einen JSON-Antwort mit folgendem Format:
{
  "analysis": "Kurze Analyse der Situation",
  "conflicts": ["Liste von Konflikten"],
  "suggestions": [
    {
      "requestId": "ID des Wunsches",
      "recommendation": "approve" | "modify" | "reject",
      "score": 1-100,
      "reasoning": "Begründung",
      "alternativeDates": { "startDate": "YYYY-MM-DD", "endDate": "YYYY-MM-DD" } // nur wenn modify
    }
  ],
  "tips": ["Allgemeine Tipps für bessere Urlaubsplanung"]
}`

    const { text } = await generateText({
      model: "anthropic/claude-sonnet-4-20250514",
      prompt,
      maxOutputTokens: 2000,
    })

    // Parse AI response
    let aiResponse
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        aiResponse = JSON.parse(jsonMatch[0])
      } else {
        throw new Error("No JSON found")
      }
    } catch (e) {
      console.error("[v0] Failed to parse AI response:", e)
      aiResponse = {
        analysis: "KI-Analyse konnte nicht durchgeführt werden",
        conflicts: [],
        suggestions: [],
        tips: [],
      }
    }

    // Update requests with AI scores
    if (aiResponse.suggestions && Array.isArray(aiResponse.suggestions)) {
      for (const suggestion of aiResponse.suggestions) {
        if (suggestion.requestId && suggestion.score) {
          await supabase
            .from("holiday_requests")
            .update({
              ai_score: suggestion.score,
              ai_reasoning: suggestion.reasoning,
              ai_suggested: true,
            })
            .eq("id", suggestion.requestId)
        }
      }
    }

    return NextResponse.json({
      ...aiResponse,
      memberEntitlements,
    })
  } catch (error) {
    console.error("[v0] Error in holiday optimization:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
