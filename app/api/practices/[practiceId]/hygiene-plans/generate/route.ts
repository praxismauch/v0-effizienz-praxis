import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { generateText } from "ai"

const RKI_HYGIENE_CONTEXT = `
Robert Koch Institut (RKI) Hygiene Guidelines for Medical Practices:

1. Hand Hygiene:
- Hand disinfection before and after patient contact
- Hand washing when visibly soiled
- Use of WHO 5 Moments for Hand Hygiene

2. Surface Disinfection:
- Regular disinfection of contact surfaces
- Disinfection after each patient for examination surfaces
- Use of RKI/VAH approved disinfectants

3. Sterilization:
- Follow DIN EN ISO 13060 standards
- Regular validation of sterilization equipment
- Documentation of sterilization cycles

4. Waste Management:
- Separate infectious and non-infectious waste
- Use of appropriate containers
- Follow local waste management regulations

5. Occupational Safety:
- Use of personal protective equipment (PPE)
- Vaccination recommendations for staff
- Post-exposure protocols

6. Quality Management:
- Regular hygiene inspections
- Staff training and documentation
- Compliance monitoring
`

export async function POST(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    const supabase = await createClient()
    const body = await request.json()

    const { category, practiceType, customRequirements, userId } = body

    console.log("[v0] Generating hygiene plan for category:", category)

    // Generate AI-based hygiene plan using RKI guidelines
    const prompt = `Based on the Robert Koch Institut (RKI) guidelines for medical practices in Germany, create a comprehensive hygiene plan for the following:

Category: ${category}
Practice Type: ${practiceType || "General medical practice"}
Custom Requirements: ${customRequirements || "None"}

${RKI_HYGIENE_CONTEXT}

Please provide a detailed hygiene plan in JSON format with the following structure:
{
  "title": "Clear, descriptive title",
  "description": "Brief overview of the hygiene plan",
  "category": "${category}",
  "frequency": "daily/weekly/monthly/as_needed",
  "responsible_role": "Who is responsible (e.g., Practice Manager, All Staff)",
  "content": {
    "objective": "Main goal of this hygiene measure",
    "materials": ["List of required materials and products"],
    "steps": [
      {"step": 1, "description": "Detailed step description", "critical": true/false}
    ],
    "documentation": "What needs to be documented",
    "quality_indicators": ["How to measure compliance"],
    "references": ["Specific RKI guideline references"]
  },
  "rki_reference_url": "URL to relevant RKI guideline if available",
  "tags": ["relevant", "tags"]
}

Ensure the plan is:
- Compliant with current RKI guidelines
- Practical and implementable in a medical practice
- Clear and easy to follow
- Includes specific product recommendations when relevant
- Addresses quality and safety standards`

    const { text } = await generateText({
      model: "anthropic/claude-sonnet-4-20250514",
      prompt,
      temperature: 0.7,
      maxOutputTokens: 2000,
    })

    console.log("[v0] AI generated hygiene plan")

    // Parse the AI response
    let parsedPlan
    try {
      // Try to extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        parsedPlan = JSON.parse(jsonMatch[0])
      } else {
        throw new Error("No JSON found in response")
      }
    } catch (parseError) {
      console.error("[v0] Error parsing AI response:", parseError)
      return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 })
    }

    // Save the generated plan to the database
    const { data: hygienePlan, error } = await supabase
      .from("hygiene_plans")
      .insert({
        practice_id: practiceId,
        title: parsedPlan.title,
        description: parsedPlan.description,
        category: parsedPlan.category || category,
        frequency: parsedPlan.frequency,
        responsible_role: parsedPlan.responsible_role,
        content: parsedPlan.content,
        is_rki_template: true,
        rki_reference_url: parsedPlan.rki_reference_url,
        status: "active",
        tags: parsedPlan.tags || [],
        created_by: userId,
        updated_by: userId,
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Error saving generated hygiene plan:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("[v0] Saved AI-generated hygiene plan:", hygienePlan.id)
    return NextResponse.json({ hygienePlan }, { status: 201 })
  } catch (error) {
    console.error("[v0] Error generating hygiene plan:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
