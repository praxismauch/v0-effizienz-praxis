import { generateText } from "ai"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { previousVersion, currentVersion, changeList } = body

    if (!changeList || changeList.length === 0) {
      return NextResponse.json(
        {
          error: "No changes provided",
        },
        { status: 400 },
      )
    }

    const prompt = `You are a technical writer creating user-friendly release notes for a medical practice management software.

Previous Version: ${previousVersion || "N/A"}
Current Version: ${currentVersion}

Raw changes:
${changeList.map((change: string, idx: number) => `${idx + 1}. ${change}`).join("\n")}

Please analyze these changes and create a well-structured changelog entry with:
1. A catchy title for this release
2. A brief description (2-3 sentences) highlighting the most important improvements
3. Categorized changes in JSON format with categories like "New Features", "Improvements", "Bug Fixes", "Security"

Return ONLY a valid JSON object in this exact format:
{
  "title": "Release title here",
  "description": "Brief description here",
  "changes": [
    {
      "category": "New Features",
      "items": ["User-friendly description of feature 1", "User-friendly description of feature 2"]
    },
    {
      "category": "Improvements",
      "items": ["User-friendly description of improvement 1"]
    }
  ]
}

Make the descriptions clear, concise, and focused on user benefits. Use German language for the output.`

    const { text } = await generateText({
      model: "openai/gpt-4o", // Upgraded from gpt-4o-mini to gpt-4o for better changelog generation
      prompt,
    })

    // Parse the AI response
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error("AI response did not contain valid JSON")
    }

    const result = JSON.parse(jsonMatch[0])

    return NextResponse.json(result)
  } catch (error) {
    console.error("[v0] Error generating AI changelog:", error)
    return NextResponse.json({ error: "Failed to generate changelog with AI" }, { status: 500 })
  }
}
