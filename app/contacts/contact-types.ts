export interface Contact {
  id: string
  salutation: string | null
  title: string | null
  first_name: string | null
  last_name: string
  company: string | null
  position: string | null
  email: string | null
  phone: string | null
  mobile: string | null
  street: string | null
  house_number: string | null
  postal_code: string | null
  city: string | null
  category: string | null
  image_url: string | null
  ai_extracted: boolean
  is_active: boolean
  is_favorite?: boolean
  created_at: string
  contact_person: string | null
  direct_phone: string | null
  availability: string | null
}

export interface VisibleColumns {
  name: boolean
  company: boolean
  contact: boolean
  address: boolean
  category: boolean
}
