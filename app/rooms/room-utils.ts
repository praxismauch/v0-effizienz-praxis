export const ROOM_COLOR_OPTIONS = [
  { value: "green", label: "Grün", class: "bg-green-500", bg: "bg-green-50", border: "border-l-4 border-l-green-500", icon: "text-green-600" },
  { value: "blue", label: "Blau", class: "bg-blue-500", bg: "bg-blue-50", border: "border-l-4 border-l-blue-500", icon: "text-blue-600" },
  { value: "purple", label: "Lila", class: "bg-purple-500", bg: "bg-purple-50", border: "border-l-4 border-l-purple-500", icon: "text-purple-600" },
  { value: "orange", label: "Orange", class: "bg-orange-500", bg: "bg-orange-50", border: "border-l-4 border-l-orange-500", icon: "text-orange-600" },
  { value: "red", label: "Rot", class: "bg-red-500", bg: "bg-red-50", border: "border-l-4 border-l-red-500", icon: "text-red-600" },
  { value: "teal", label: "Türkis", class: "bg-teal-500", bg: "bg-teal-50", border: "border-l-4 border-l-teal-500", icon: "text-teal-600" },
  { value: "pink", label: "Pink", class: "bg-pink-500", bg: "bg-pink-50", border: "border-l-4 border-l-pink-500", icon: "text-pink-600" },
  { value: "yellow", label: "Gelb", class: "bg-yellow-500", bg: "bg-yellow-50", border: "border-l-4 border-l-yellow-500", icon: "text-yellow-600" },
]

export interface Device {
  id: string
  name: string
  category?: string
  manufacturer?: string
  model?: string
  status?: string
  image_url?: string
}

export interface Room {
  id: string
  name: string
  beschreibung?: string
  color?: string
  images?: string[]
  practice_id: string
  created_at: string
  updated_at?: string
}

const ROOM_COLORS: Record<string, { bg: string; border: string; icon: string }> = {
  anmeldung: { bg: "bg-blue-50", border: "border-l-4 border-l-blue-500", icon: "text-blue-600" },
  empfang: { bg: "bg-blue-50", border: "border-l-4 border-l-blue-500", icon: "text-blue-600" },
  arzt: { bg: "bg-emerald-50", border: "border-l-4 border-l-emerald-500", icon: "text-emerald-600" },
  behandlung: { bg: "bg-emerald-50", border: "border-l-4 border-l-emerald-500", icon: "text-emerald-600" },
  untersuchung: { bg: "bg-teal-50", border: "border-l-4 border-l-teal-500", icon: "text-teal-600" },
  ekg: { bg: "bg-rose-50", border: "border-l-4 border-l-rose-500", icon: "text-rose-600" },
  labor: { bg: "bg-purple-50", border: "border-l-4 border-l-purple-500", icon: "text-purple-600" },
  büro: { bg: "bg-amber-50", border: "border-l-4 border-l-amber-500", icon: "text-amber-600" },
  office: { bg: "bg-amber-50", border: "border-l-4 border-l-amber-500", icon: "text-amber-600" },
  küche: { bg: "bg-orange-50", border: "border-l-4 border-l-orange-500", icon: "text-orange-600" },
  pause: { bg: "bg-orange-50", border: "border-l-4 border-l-orange-500", icon: "text-orange-600" },
  sozial: { bg: "bg-orange-50", border: "border-l-4 border-l-orange-500", icon: "text-orange-600" },
  server: { bg: "bg-slate-100", border: "border-l-4 border-l-slate-500", icon: "text-slate-600" },
  technik: { bg: "bg-slate-100", border: "border-l-4 border-l-slate-500", icon: "text-slate-600" },
  lager: { bg: "bg-stone-50", border: "border-l-4 border-l-stone-500", icon: "text-stone-600" },
  archiv: { bg: "bg-stone-50", border: "border-l-4 border-l-stone-500", icon: "text-stone-600" },
  warte: { bg: "bg-sky-50", border: "border-l-4 border-l-sky-500", icon: "text-sky-600" },
  warteraum: { bg: "bg-sky-50", border: "border-l-4 border-l-sky-500", icon: "text-sky-600" },
  röntgen: { bg: "bg-indigo-50", border: "border-l-4 border-l-indigo-500", icon: "text-indigo-600" },
  ultraschall: { bg: "bg-violet-50", border: "border-l-4 border-l-violet-500", icon: "text-violet-600" },
  sono: { bg: "bg-violet-50", border: "border-l-4 border-l-violet-500", icon: "text-violet-600" },
  op: { bg: "bg-red-50", border: "border-l-4 border-l-red-500", icon: "text-red-600" },
  eingriff: { bg: "bg-red-50", border: "border-l-4 border-l-red-500", icon: "text-red-600" },
  physio: { bg: "bg-lime-50", border: "border-l-4 border-l-lime-500", icon: "text-lime-600" },
  therapie: { bg: "bg-lime-50", border: "border-l-4 border-l-lime-500", icon: "text-lime-600" },
  wc: { bg: "bg-gray-50", border: "border-l-4 border-l-gray-400", icon: "text-gray-500" },
  toilette: { bg: "bg-gray-50", border: "border-l-4 border-l-gray-400", icon: "text-gray-500" },
}

const FALLBACK_COLORS = [
  { bg: "bg-cyan-50", border: "border-l-4 border-l-cyan-500", icon: "text-cyan-600" },
  { bg: "bg-pink-50", border: "border-l-4 border-l-pink-500", icon: "text-pink-600" },
  { bg: "bg-fuchsia-50", border: "border-l-4 border-l-fuchsia-500", icon: "text-fuchsia-600" },
  { bg: "bg-emerald-50", border: "border-l-4 border-l-emerald-500", icon: "text-emerald-600" },
]

export function getRoomColor(room: Room, index: number): { bg: string; border: string; icon: string; hex?: string } {
  if (room.color) {
    const customColor = ROOM_COLOR_OPTIONS.find(c => c.value === room.color)
    if (customColor) {
      return { bg: customColor.bg, border: customColor.border, icon: customColor.icon }
    }
    if (room.color.startsWith("#")) {
      return { bg: "", border: "border-l-4", icon: "", hex: room.color }
    }
  }

  const nameLower = room.name.toLowerCase()
  for (const [keyword, colors] of Object.entries(ROOM_COLORS)) {
    if (nameLower.includes(keyword)) {
      return colors
    }
  }

  return FALLBACK_COLORS[index % FALLBACK_COLORS.length]
}
