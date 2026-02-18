import { type NextRequest, NextResponse } from "next/server"
import { getSidebarBadges } from "@/lib/db/queries"
import { getCached, setCached, cacheKeys, cacheTTL } from "@/lib/redis"

const defaultBadges = {
  tasks: 0,
  goals: 0,
  workflows: 0,
  candidates: 0,
  tickets: 0,
  teamMembers: 0,
  responsibilities: 0,
  surveys: 0,
  inventory: 0,
  devices: 0,
  calendar: 0,
  documents: 0,
  cirs: 0,
  contacts: 0,
  hygiene: 0,
  training: 0,
  protocols: 0,
  journal: 0,
  appraisals: 0,
  skills: 0,
  workplaces: 0,
  rooms: 0,
  equipment: 0,
  dienstplan: 0,
  zeiterfassung: 0,
  analytics: 0,
  knowledge: 0,
  strategy: 0,
  leadership: 0,
  wellbeing: 0,
  leitbild: 0,
  selfcheck: 0,
  organigramm: 0,
  schwarzesBrett: 0,
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params

    if (!practiceId) {
      return NextResponse.json(defaultBadges)
    }

    const cacheKey = cacheKeys.sidebarBadges(practiceId)
    const cached = await getCached<any>(cacheKey)

    if (cached) {
      return new Response(JSON.stringify(cached), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=120, stale-while-revalidate=300",
          "X-Cache": "HIT",
        },
      })
    }

    const { data, error } = await getSidebarBadges(practiceId)

    if (error) {
      console.error("Error fetching sidebar badges:", error)
    }

    await setCached(cacheKey, data, cacheTTL.sidebarBadges)

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=120, stale-while-revalidate=300",
        "X-Cache": "MISS",
      },
    })
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json(defaultBadges)
  }
}
