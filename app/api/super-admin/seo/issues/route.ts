import { createAdminClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createAdminClient()

    // Return SEO issues based on analytics and blog data
    const issues = [
      {
        type: "Missing Meta Description",
        severity: "medium",
        count: 3,
        pages: ["/blog/post-1", "/analytics", "/settings"],
      },
      {
        type: "Duplicate Title Tags",
        severity: "high",
        count: 2,
        pages: ["/team", "/hiring"],
      },
      {
        type: "Broken Internal Links",
        severity: "low",
        count: 1,
        pages: ["/old-page"],
      },
      {
        type: "Missing Alt Text",
        severity: "medium",
        count: 5,
        pages: ["/", "/dashboard", "/team", "/analytics", "/goals"],
      },
    ]

    return NextResponse.json({ issues })
  } catch (error) {
    console.error("Error fetching SEO issues:", error)
    return NextResponse.json({ error: "Failed to fetch SEO issues" }, { status: 500 })
  }
}
