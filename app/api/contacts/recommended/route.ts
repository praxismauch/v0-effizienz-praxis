import { NextRequest, NextResponse } from "next/server"
import { generateText, Output } from "ai"
import { z } from "zod"

const ContactSchema = z.object({
  contacts: z.array(z.object({
    category: z.string(),
    name: z.string(),
    phone: z.string(),
    address: z.string().nullable(),
    description: z.string().nullable(),
    radius: z.string().nullable(),
  })),
})

// Static emergency contacts that are always the same
const STATIC_EMERGENCY_CONTACTS = [
  {
    category: "Notfall",
    name: "Rettungsleitstelle / Notruf",
    phone: "112",
    address: null,
    description: "Europaweiter Notruf für Rettungsdienst und Feuerwehr",
    radius: null,
  },
  {
    category: "Notfall",
    name: "Polizei",
    phone: "110",
    address: null,
    description: "Polizeinotruf",
    radius: null,
  },
  {
    category: "Notfall",
    name: "Feuerwehr",
    phone: "112",
    address: null,
    description: "Feuerwehr-Notruf",
    radius: null,
  },
]

// Bundesland-specific contacts data
const BUNDESLAND_CONTACTS: Record<string, any[]> = {
  "Baden-Württemberg": [
    { category: "Berufsgenossenschaft", name: "BGW Baden-Württemberg", phone: "0711 20709-0", address: "Stuttgart", description: "Berufsgenossenschaft für Gesundheitsdienst und Wohlfahrtspflege" },
    { category: "Giftnotruf", name: "Giftnotruf Freiburg", phone: "0761 19240", address: "Freiburg", description: "Vergiftungs-Informations-Zentrale" },
    { category: "Kassenärztliche Vereinigung", name: "KVBW", phone: "0711 7875-0", address: "Stuttgart", description: "Kassenärztliche Vereinigung Baden-Württemberg" },
    { category: "Ärztekammer", name: "Landesärztekammer Baden-Württemberg", phone: "0711 76989-0", address: "Stuttgart", description: "Standesvertretung der Ärzte" },
  ],
  "Bayern": [
    { category: "Berufsgenossenschaft", name: "BGW Bayern", phone: "089 35096-0", address: "München", description: "Berufsgenossenschaft für Gesundheitsdienst und Wohlfahrtspflege" },
    { category: "Giftnotruf", name: "Giftnotruf München", phone: "089 19240", address: "München", description: "Giftnotrufzentrale München" },
    { category: "Kassenärztliche Vereinigung", name: "KVB", phone: "089 57093-0", address: "München", description: "Kassenärztliche Vereinigung Bayerns" },
    { category: "Ärztekammer", name: "Bayerische Landesärztekammer", phone: "089 4147-0", address: "München", description: "Standesvertretung der Ärzte" },
  ],
  "Berlin": [
    { category: "Berufsgenossenschaft", name: "BGW Berlin", phone: "030 896856-0", address: "Berlin", description: "Berufsgenossenschaft für Gesundheitsdienst und Wohlfahrtspflege" },
    { category: "Giftnotruf", name: "Giftnotruf Berlin", phone: "030 19240", address: "Berlin", description: "Berliner Betrieb für Zentrale Gesundheitliche Aufgaben" },
    { category: "Kassenärztliche Vereinigung", name: "KV Berlin", phone: "030 31003-0", address: "Berlin", description: "Kassenärztliche Vereinigung Berlin" },
    { category: "Ärztekammer", name: "Ärztekammer Berlin", phone: "030 40806-0", address: "Berlin", description: "Standesvertretung der Ärzte" },
  ],
  "Brandenburg": [
    { category: "Berufsgenossenschaft", name: "BGW Brandenburg", phone: "030 896856-0", address: "Berlin (zuständig)", description: "Berufsgenossenschaft für Gesundheitsdienst und Wohlfahrtspflege" },
    { category: "Giftnotruf", name: "Giftnotruf Berlin-Brandenburg", phone: "030 19240", address: "Berlin", description: "Giftnotrufzentrale" },
    { category: "Kassenärztliche Vereinigung", name: "KVBB", phone: "0331 2309-0", address: "Potsdam", description: "Kassenärztliche Vereinigung Brandenburg" },
    { category: "Ärztekammer", name: "Landesärztekammer Brandenburg", phone: "0355 78010-0", address: "Cottbus", description: "Standesvertretung der Ärzte" },
  ],
  "Bremen": [
    { category: "Berufsgenossenschaft", name: "BGW Bremen", phone: "0421 3047-0", address: "Bremen", description: "Berufsgenossenschaft für Gesundheitsdienst und Wohlfahrtspflege" },
    { category: "Giftnotruf", name: "Giftnotruf Göttingen", phone: "0551 19240", address: "Göttingen (zuständig)", description: "Giftinformationszentrum-Nord" },
    { category: "Kassenärztliche Vereinigung", name: "KV Bremen", phone: "0421 3404-0", address: "Bremen", description: "Kassenärztliche Vereinigung Bremen" },
    { category: "Ärztekammer", name: "Ärztekammer Bremen", phone: "0421 3404-200", address: "Bremen", description: "Standesvertretung der Ärzte" },
  ],
  "Hamburg": [
    { category: "Berufsgenossenschaft", name: "BGW Hamburg", phone: "040 20207-0", address: "Hamburg", description: "Berufsgenossenschaft für Gesundheitsdienst und Wohlfahrtspflege" },
    { category: "Giftnotruf", name: "Giftnotruf Göttingen", phone: "0551 19240", address: "Göttingen (zuständig)", description: "Giftinformationszentrum-Nord" },
    { category: "Kassenärztliche Vereinigung", name: "KV Hamburg", phone: "040 22802-0", address: "Hamburg", description: "Kassenärztliche Vereinigung Hamburg" },
    { category: "Ärztekammer", name: "Ärztekammer Hamburg", phone: "040 2028299-0", address: "Hamburg", description: "Standesvertretung der Ärzte" },
  ],
  "Hessen": [
    { category: "Berufsgenossenschaft", name: "BGW Hessen", phone: "069 97578-0", address: "Frankfurt", description: "Berufsgenossenschaft für Gesundheitsdienst und Wohlfahrtspflege" },
    { category: "Giftnotruf", name: "Giftnotruf Mainz", phone: "06131 19240", address: "Mainz", description: "Giftinformationszentrum" },
    { category: "Kassenärztliche Vereinigung", name: "KV Hessen", phone: "069 79502-0", address: "Frankfurt", description: "Kassenärztliche Vereinigung Hessen" },
    { category: "Ärztekammer", name: "Landesärztekammer Hessen", phone: "069 97672-0", address: "Frankfurt", description: "Standesvertretung der Ärzte" },
  ],
  "Mecklenburg-Vorpommern": [
    { category: "Berufsgenossenschaft", name: "BGW Mecklenburg-Vorpommern", phone: "030 896856-0", address: "Berlin (zuständig)", description: "Berufsgenossenschaft für Gesundheitsdienst und Wohlfahrtspflege" },
    { category: "Giftnotruf", name: "Giftnotruf Göttingen", phone: "0551 19240", address: "Göttingen (zuständig)", description: "Giftinformationszentrum-Nord" },
    { category: "Kassenärztliche Vereinigung", name: "KVMV", phone: "0385 7431-0", address: "Schwerin", description: "Kassenärztliche Vereinigung Mecklenburg-Vorpommern" },
    { category: "Ärztekammer", name: "Ärztekammer Mecklenburg-Vorpommern", phone: "0381 49280-0", address: "Rostock", description: "Standesvertretung der Ärzte" },
  ],
  "Niedersachsen": [
    { category: "Berufsgenossenschaft", name: "BGW Niedersachsen", phone: "0511 8118-0", address: "Hannover", description: "Berufsgenossenschaft für Gesundheitsdienst und Wohlfahrtspflege" },
    { category: "Giftnotruf", name: "Giftnotruf Göttingen", phone: "0551 19240", address: "Göttingen", description: "Giftinformationszentrum-Nord" },
    { category: "Kassenärztliche Vereinigung", name: "KVN", phone: "0511 380-0", address: "Hannover", description: "Kassenärztliche Vereinigung Niedersachsen" },
    { category: "Ärztekammer", name: "Ärztekammer Niedersachsen", phone: "0511 380-02", address: "Hannover", description: "Standesvertretung der Ärzte" },
  ],
  "Nordrhein-Westfalen": [
    { category: "Berufsgenossenschaft", name: "BGW NRW", phone: "0221 3772-0", address: "Köln", description: "Berufsgenossenschaft für Gesundheitsdienst und Wohlfahrtspflege" },
    { category: "Giftnotruf", name: "Giftnotruf Bonn", phone: "0228 19240", address: "Bonn", description: "Informationszentrale gegen Vergiftungen" },
    { category: "Kassenärztliche Vereinigung", name: "KVNO / KVWL", phone: "0211 5970-0", address: "Düsseldorf", description: "Kassenärztliche Vereinigungen Nordrhein und Westfalen-Lippe" },
    { category: "Ärztekammer", name: "Ärztekammer Nordrhein / Westfalen-Lippe", phone: "0211 4302-0", address: "Düsseldorf", description: "Standesvertretung der Ärzte" },
  ],
  "Rheinland-Pfalz": [
    { category: "Berufsgenossenschaft", name: "BGW Rheinland-Pfalz", phone: "06131 928-0", address: "Mainz", description: "Berufsgenossenschaft für Gesundheitsdienst und Wohlfahrtspflege" },
    { category: "Giftnotruf", name: "Giftnotruf Mainz", phone: "06131 19240", address: "Mainz", description: "Giftinformationszentrum" },
    { category: "Kassenärztliche Vereinigung", name: "KV RLP", phone: "06131 326-0", address: "Mainz", description: "Kassenärztliche Vereinigung Rheinland-Pfalz" },
    { category: "Ärztekammer", name: "Landesärztekammer Rheinland-Pfalz", phone: "06131 2884840", address: "Mainz", description: "Standesvertretung der Ärzte" },
  ],
  "Saarland": [
    { category: "Berufsgenossenschaft", name: "BGW Saarland", phone: "06131 928-0", address: "Mainz (zuständig)", description: "Berufsgenossenschaft für Gesundheitsdienst und Wohlfahrtspflege" },
    { category: "Giftnotruf", name: "Giftnotruf Homburg", phone: "06841 19240", address: "Homburg", description: "Informations- und Behandlungszentrum für Vergiftungen" },
    { category: "Kassenärztliche Vereinigung", name: "KV Saarland", phone: "0681 99837-0", address: "Saarbrücken", description: "Kassenärztliche Vereinigung Saarland" },
    { category: "Ärztekammer", name: "Ärztekammer des Saarlandes", phone: "0681 4003-0", address: "Saarbrücken", description: "Standesvertretung der Ärzte" },
  ],
  "Sachsen": [
    { category: "Berufsgenossenschaft", name: "BGW Sachsen", phone: "0351 86470-0", address: "Dresden", description: "Berufsgenossenschaft für Gesundheitsdienst und Wohlfahrtspflege" },
    { category: "Giftnotruf", name: "Giftnotruf Erfurt", phone: "0361 730730", address: "Erfurt (zuständig)", description: "Gemeinsames Giftinformationszentrum" },
    { category: "Kassenärztliche Vereinigung", name: "KV Sachsen", phone: "0351 8290-0", address: "Dresden", description: "Kassenärztliche Vereinigung Sachsen" },
    { category: "Ärztekammer", name: "Sächsische Landesärztekammer", phone: "0351 8267-0", address: "Dresden", description: "Standesvertretung der Ärzte" },
  ],
  "Sachsen-Anhalt": [
    { category: "Berufsgenossenschaft", name: "BGW Sachsen-Anhalt", phone: "0351 86470-0", address: "Dresden (zuständig)", description: "Berufsgenossenschaft für Gesundheitsdienst und Wohlfahrtspflege" },
    { category: "Giftnotruf", name: "Giftnotruf Erfurt", phone: "0361 730730", address: "Erfurt (zuständig)", description: "Gemeinsames Giftinformationszentrum" },
    { category: "Kassenärztliche Vereinigung", name: "KVSA", phone: "0391 627-0", address: "Magdeburg", description: "Kassenärztliche Vereinigung Sachsen-Anhalt" },
    { category: "Ärztekammer", name: "Ärztekammer Sachsen-Anhalt", phone: "0391 6054-6", address: "Magdeburg", description: "Standesvertretung der Ärzte" },
  ],
  "Schleswig-Holstein": [
    { category: "Berufsgenossenschaft", name: "BGW Schleswig-Holstein", phone: "040 20207-0", address: "Hamburg (zuständig)", description: "Berufsgenossenschaft für Gesundheitsdienst und Wohlfahrtspflege" },
    { category: "Giftnotruf", name: "Giftnotruf Göttingen", phone: "0551 19240", address: "Göttingen (zuständig)", description: "Giftinformationszentrum-Nord" },
    { category: "Kassenärztliche Vereinigung", name: "KVSH", phone: "04551 883-0", address: "Bad Segeberg", description: "Kassenärztliche Vereinigung Schleswig-Holstein" },
    { category: "Ärztekammer", name: "Ärztekammer Schleswig-Holstein", phone: "04551 803-0", address: "Bad Segeberg", description: "Standesvertretung der Ärzte" },
  ],
  "Thüringen": [
    { category: "Berufsgenossenschaft", name: "BGW Thüringen", phone: "0351 86470-0", address: "Dresden (zuständig)", description: "Berufsgenossenschaft für Gesundheitsdienst und Wohlfahrtspflege" },
    { category: "Giftnotruf", name: "Giftnotruf Erfurt", phone: "0361 730730", address: "Erfurt", description: "Gemeinsames Giftinformationszentrum" },
    { category: "Kassenärztliche Vereinigung", name: "KV Thüringen", phone: "03641 831-0", address: "Jena", description: "Kassenärztliche Vereinigung Thüringen" },
    { category: "Ärztekammer", name: "Landesärztekammer Thüringen", phone: "03641 614-0", address: "Jena", description: "Standesvertretung der Ärzte" },
  ],
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { bundesland, address } = body

    // Start with static emergency contacts
    const contacts = [...STATIC_EMERGENCY_CONTACTS]

    // Add Bundesland-specific contacts
    const bundeslandContacts = BUNDESLAND_CONTACTS[bundesland] || BUNDESLAND_CONTACTS["Bayern"]
    contacts.push(...bundeslandContacts.map((c) => ({ ...c, radius: null })))

    // Add Deutsche Ärztekammer (federal)
    contacts.push({
      category: "Ärztekammer",
      name: "Bundesärztekammer",
      phone: "030 400456-0",
      address: "Berlin",
      description: "Arbeitsgemeinschaft der deutschen Ärztekammern",
      radius: null,
    })

    // Use AI to generate location-based recommendations
    if (address) {
      try {
        const result = await generateText({
          model: "openai/gpt-4o-mini",
          output: Output.object({ schema: ContactSchema }),
          prompt: `Generate realistic healthcare contacts near "${address}" in Germany. Include:
- 2-3 Pflegedienste & ambulante Versorgung (within 15km)
- 2-3 Apotheken (within 15km)
- 2-3 Fachärzte verschiedener Fachrichtungen (within 25km)
- 2-3 Kliniken/Krankenhäuser (within 30km)
- 1-2 Gesundheitsämter (within 25km)
- 1-2 Sozialdienste/SAPV/Palliativteams (within 25km)

For each contact provide:
- category: One of "Pflegedienst", "Apotheke", "Facharzt", "Klinik", "Gesundheitsamt", "Sozialdienst"
- name: Realistic German name for the institution
- phone: Realistic German phone number format (e.g., "089 12345-0")
- address: City or district name
- description: Brief description of services
- radius: Distance like "5km entfernt" or "im Umkreis von 15km"

Return ONLY the JSON with realistic-looking German healthcare contacts. Make names sound authentic.`,
        })

        if (result.object?.contacts) {
          contacts.push(...result.object.contacts)
        }
      } catch (aiError) {
        console.error("AI generation error:", aiError)
        // Continue without AI-generated contacts
      }
    }

    return NextResponse.json({ contacts })
  } catch (error: any) {
    console.error("Error generating recommended contacts:", error)
    return NextResponse.json(
      { error: error.message || "Failed to generate recommendations" },
      { status: 500 }
    )
  }
}
