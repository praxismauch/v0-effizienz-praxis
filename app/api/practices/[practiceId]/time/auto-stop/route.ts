import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const DEFAULT_SETTINGS = {
  auto_stop_enabled: true,
  auto_stop_hours: 12,
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string }> }
) {
  try {
    const { practiceId } = await params
    const supabase = await createClient()

    // Get practice time tracking settings
    const { data: practiceSettings } = await supabase
      .from("practice_settings")
      .select("time_tracking_settings")
      .eq("practice_id", practiceId)
      .maybeSingle()

    const settings = practiceSettings?.time_tracking_settings || DEFAULT_SETTINGS

    if (!settings.auto_stop_enabled) {
      return NextResponse.json({ stopped: 0, message: "Auto-stop is disabled" })
    }

    const maxHours = settings.auto_stop_hours || 12
    const now = new Date()
    const cutoff = new Date(now.getTime() - maxHours * 60 * 60 * 1000)

    // Find all open time blocks that started before the cutoff
    const { data: staleBlocks, error: findError } = await supabase
      .from("time_blocks")
      .select("*")
      .eq("practice_id", practiceId)
      .eq("is_open", true)
      .is("end_time", null)
      .lt("start_time", cutoff.toISOString())

    if (findError) throw findError

    if (!staleBlocks || staleBlocks.length === 0) {
      return NextResponse.json({ stopped: 0, message: "No stale blocks found" })
    }

    // Close each stale block
    const closedBlocks = []
    for (const block of staleBlocks) {
      const startTime = new Date(block.start_time)
      const autoEndTime = new Date(startTime.getTime() + maxHours * 60 * 60 * 1000)
      const breakMins = block.break_minutes || 0
      const totalMinutes = (autoEndTime.getTime() - startTime.getTime()) / 60000
      const actualHours = Math.round(((totalMinutes - breakMins) / 60) * 100) / 100

      const { data: updated, error: updateError } = await supabase
        .from("time_blocks")
        .update({
          end_time: autoEndTime.toISOString(),
          is_open: false,
          auto_stopped: true,
          actual_hours: actualHours,
          notes: (block.notes ? block.notes + " | " : "") +
            `Automatisch gestoppt nach ${maxHours}h (vergessenes Ausstempeln)`,
          updated_at: now.toISOString(),
        })
        .eq("id", block.id)
        .select()
        .single()

      if (updateError) {
        console.error(`Error auto-stopping block ${block.id}:`, updateError)
      } else {
        closedBlocks.push(updated)
      }
    }

    return NextResponse.json({
      stopped: closedBlocks.length,
      blocks: closedBlocks,
      message: `${closedBlocks.length} Zeitblock(e) automatisch gestoppt`,
    })
  } catch (error: any) {
    console.error("Error in auto-stop:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
