import { NextResponse } from "next/server"

// Chat logging is disabled - landing_chat_logs table doesn't exist
// Return empty data to prevent errors

export async function GET(_req: Request) {
  return NextResponse.json({
    logs: [],
    pagination: {
      page: 1,
      limit: 50,
      total: 0,
      totalPages: 0,
    },
    statistics: {
      total: 0,
      default_responses: 0,
      greetings: 0,
      faq_matches: 0,
      faq_usage: {},
    },
  })
}

export async function DELETE(_req: Request) {
  return NextResponse.json({ success: true })
}
