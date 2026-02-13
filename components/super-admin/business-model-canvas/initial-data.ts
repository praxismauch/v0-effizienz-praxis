import type { CanvasSection, BMCData } from "./types"

function ts() { return new Date().toISOString() }

function item(id: string, text: string, priority: "high" | "medium" | "low" = "medium", status: "active" | "planned" = "active") {
  return { id, text, priority, status, createdAt: ts(), updatedAt: ts() }
}

export const getInitialSections = (): CanvasSection[] => [
  {
    id: "key-partners", title: "Schluesselpartner", titleEn: "Key Partners",
    description: "Wer sind unsere wichtigsten Partner und Lieferanten?",
    iconName: "Handshake", color: "bg-blue-50 border-blue-200",
    items: [item("kp-1", "Technologie-Partner (Cloud-Infrastruktur)", "high"), item("kp-2", "KI/ML-Dienstleister", "high"), item("kp-3", "Branchenverbaende (KV, Aerztekammern)")],
  },
  {
    id: "key-activities", title: "Schluesselaktivitaeten", titleEn: "Key Activities",
    description: "Welche Schluesselaktivitaeten erfordert unser Wertangebot?",
    iconName: "Briefcase", color: "bg-purple-50 border-purple-200",
    items: [item("ka-1", "Software-Entwicklung & Wartung", "high"), item("ka-2", "KI-Training & Optimierung", "high"), item("ka-3", "Kundensupport & Schulungen")],
  },
  {
    id: "value-propositions", title: "Wertangebote", titleEn: "Value Propositions",
    description: "Welchen Wert liefern wir dem Kunden?",
    iconName: "Gift", color: "bg-green-50 border-green-200",
    items: [item("vp-1", "Struktur. Erfolg. Leichtigkeit.", "high"), item("vp-2", "2+ Stunden Zeitersparnis taeglich", "high"), item("vp-3", "KI-gestuetzte Praxisoptimierung", "high"), item("vp-4", "Alles-in-einem Praxismanagement")],
  },
  {
    id: "customer-relationships", title: "Kundenbeziehungen", titleEn: "Customer Relationships",
    description: "Welche Art von Beziehung erwartet jedes Kundensegment?",
    iconName: "Heart", color: "bg-pink-50 border-pink-200",
    items: [item("cr-1", "Persoenlicher Support (Premium)", "high"), item("cr-2", "Self-Service Knowledge Base"), item("cr-3", "Community & Erfahrungsaustausch", "low", "planned")],
  },
  {
    id: "customer-segments", title: "Kundensegmente", titleEn: "Customer Segments",
    description: "Fuer wen schaffen wir Wert?",
    iconName: "Users", color: "bg-orange-50 border-orange-200",
    items: [item("cs-1", "Arztpraxen (Einzel & Gemeinschaft)", "high"), item("cs-2", "MVZ (Medizinische Versorgungszentren)", "high"), item("cs-3", "Therapeutenpraxen", "medium", "planned")],
  },
  {
    id: "channels", title: "Kanaele", titleEn: "Channels",
    description: "Ueber welche Kanaele erreichen wir unsere Kundensegmente?",
    iconName: "Truck", color: "bg-cyan-50 border-cyan-200",
    items: [item("ch-1", "Direktvertrieb (Online Demo)", "high"), item("ch-2", "Fachkongresse & Messen"), item("ch-3", "Empfehlungsprogramm (100 EUR)")],
  },
  {
    id: "cost-structure", title: "Kostenstruktur", titleEn: "Cost Structure",
    description: "Was sind die wichtigsten Kosten unseres Geschaeftsmodells?",
    iconName: "Wallet", color: "bg-red-50 border-red-200",
    items: [item("cost-1", "Entwicklung & Personal", "high"), item("cost-2", "Cloud-Infrastruktur & KI-APIs", "high"), item("cost-3", "Marketing & Vertrieb")],
  },
  {
    id: "revenue-streams", title: "Einnahmequellen", titleEn: "Revenue Streams",
    description: "Fuer welchen Wert sind unsere Kunden bereit zu zahlen?",
    iconName: "TrendingUp", color: "bg-emerald-50 border-emerald-200",
    items: [item("rev-1", "SaaS-Abonnements (Starter/Pro/Enterprise)", "high"), item("rev-2", "Zusatzmodule & Add-ons"), item("rev-3", "Schulungen & Onboarding", "low", "planned")],
  },
  {
    id: "key-resources", title: "Schluesselressourcen", titleEn: "Key Resources",
    description: "Welche Ressourcen erfordert unser Wertangebot?",
    iconName: "Briefcase", color: "bg-indigo-50 border-indigo-200",
    items: [item("kr-1", "Entwicklerteam", "high"), item("kr-2", "Cloud-Infrastruktur", "high"), item("kr-3", "KI-Modelle", "high"), item("kr-4", "Kundendaten"), item("kr-5", "Branchenwissen")],
  },
]

export const getInitialBMCData = (): BMCData => {
  const s = getInitialSections()
  const find = (id: string) => s.find((x) => x.id === id)!
  return {
    keyPartners: find("key-partners"),
    keyActivities: find("key-activities"),
    keyResources: find("key-resources"),
    valuePropositions: find("value-propositions"),
    customerRelationships: find("customer-relationships"),
    channels: find("channels"),
    customerSegments: find("customer-segments"),
    costStructure: find("cost-structure"),
    revenueStreams: find("revenue-streams"),
    lastModified: new Date().toISOString(),
  }
}
