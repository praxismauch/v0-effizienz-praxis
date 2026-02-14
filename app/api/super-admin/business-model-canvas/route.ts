import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const practiceId = searchParams.get("practiceId")

    if (!practiceId) {
      return NextResponse.json({ error: "Practice ID required" }, { status: 400 })
    }

    const supabase = await createAdminClient()

    // Note: business_model_canvas table may not exist yet
    // Return empty structure gracefully if table is missing
    const { data, error } = await supabase
      .from("business_model_canvas")
      .select("*")
      .eq("practice_id", practiceId)
      .single()

    if (error) {
      // PGRST116 = no rows, 42P01 = table doesn't exist - both return empty
      if (error.code === "PGRST116" || error.code === "42P01" || error.message?.includes("does not exist")) {
        return NextResponse.json({
          keyPartners: [],
          keyActivities: [],
          keyResources: [],
          valuePropositions: [],
          customerRelationships: [],
          channels: [],
          customerSegments: [],
          costStructure: [],
          revenueStreams: [],
          lastModified: null,
        })
      }
      console.error("Error fetching BMC:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({
        keyPartners: [],
        keyActivities: [],
        keyResources: [],
        valuePropositions: [],
        customerRelationships: [],
        channels: [],
        customerSegments: [],
        costStructure: [],
        revenueStreams: [],
        lastModified: null,
      })
    }

    // Transform snake_case to camelCase for frontend
    return NextResponse.json({
      keyPartners: data.key_partners || [],
      keyActivities: data.key_activities || [],
      keyResources: data.key_resources || [],
      valuePropositions: data.value_propositions || [],
      customerRelationships: data.customer_relationships || [],
      channels: data.channels || [],
      customerSegments: data.customer_segments || [],
      costStructure: data.cost_structure || [],
      revenueStreams: data.revenue_streams || [],
      lastModified: data.last_modified,
    })
  } catch (error) {
    console.error("Error in BMC GET:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { practiceId, ...bmcData } = body

    if (!practiceId) {
      return NextResponse.json({ error: "Practice ID required" }, { status: 400 })
    }

    const supabase = await createAdminClient()

    // Transform camelCase to snake_case for database
    const dbData = {
      practice_id: practiceId,
      key_partners: bmcData.keyPartners || [],
      key_activities: bmcData.keyActivities || [],
      key_resources: bmcData.keyResources || [],
      value_propositions: bmcData.valuePropositions || [],
      customer_relationships: bmcData.customerRelationships || [],
      channels: bmcData.channels || [],
      customer_segments: bmcData.customerSegments || [],
      cost_structure: bmcData.costStructure || [],
      revenue_streams: bmcData.revenueStreams || [],
      last_modified: new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from("business_model_canvas")
      .upsert(dbData, { onConflict: "practice_id" })
      .select()
      .single()

    if (error) {
      console.error("Error saving BMC:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("Error in BMC POST:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
