import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  // Return empty array - favorites are handled client-side via localStorage
  // This prevents 500 errors when Supabase isn't configured
  return NextResponse.json({ favorites: [] })
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  // Return success - favorites are handled client-side via localStorage
  // This prevents 500 errors when Supabase isn't configured
  const body = await request.json()
  const { action } = body
  return NextResponse.json({ success: true, action })
}
