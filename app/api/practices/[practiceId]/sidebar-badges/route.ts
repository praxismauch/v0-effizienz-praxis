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
