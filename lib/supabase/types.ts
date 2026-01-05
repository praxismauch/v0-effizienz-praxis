export interface TeamMemberArbeitsmittel {
  id: string
  practice_id: string
  team_member_id: string
  arbeitsmittel_id: string
  given_date: string
  expected_return_date?: string
  actual_return_date?: string
  description?: string
  signature_data?: string // Base64 encoded signature image
  signed_at?: string
  status: "ausgegeben" | "zurückgegeben"
  notes?: string
  created_at: string
  updated_at: string
  created_by?: string
}
