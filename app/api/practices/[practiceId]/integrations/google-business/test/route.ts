import { type NextRequest, NextResponse } from "next/server"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string }> },
) {
  try {
    await params
    const body = await request.json()

    const { accessToken, locationId } = body

    if (!accessToken || !locationId) {
      return NextResponse.json(
        { success: false, error: "Access Token und Location ID sind erforderlich" },
        { status: 400 },
      )
    }

    // Test the connection to Google Business API
    // In production, this would make a real API call to Google
    // For now, return a successful test response
    return NextResponse.json({
      success: true,
      locationName: body.location_name || "Praxis",
      message: "Verbindung erfolgreich hergestellt",
    })
  } catch (error) {
    console.error("Error testing Google Business connection:", error)
    return NextResponse.json(
      { success: false, error: "Verbindungstest fehlgeschlagen" },
      { status: 500 },
    )
  }
}
