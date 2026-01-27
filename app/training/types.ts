export interface TrainingCourse {
  id: string
  name: string
  description: string
  category: string
  provider: string
  duration_hours: number
  cost: number
  currency: string
  is_online: boolean
  location: string
  registration_url: string
  is_mandatory: boolean
  recurrence_months: number
  max_participants: number
  is_active: boolean
  team_id: string
  created_at: string
}

export interface TrainingEvent {
  id: string
  title: string
  description: string
  training_course_id: string
  start_date: string
  end_date: string
  start_time: string
  end_time: string
  location: string
  meeting_link: string
  is_online: boolean
  max_participants: number
  cost_per_person: number
  currency: string
  status: string
  notes: string
  team_id: string
  training_course?: TrainingCourse
  registrations?: TrainingEventRegistration[]
}

export interface TrainingEventRegistration {
  id: string
  training_event_id: string
  team_member_id: string
  status: string
  registered_at: string
  team_member?: { id: string; first_name: string; last_name: string }
}

export interface Certification {
  id: string
  name: string
  description: string
  issuing_authority: string
  category: string
  validity_months: number
  is_mandatory: boolean
  reminder_days_before: number
  is_active: boolean
  icon: string
  color: string
  team_id: string
}

export interface TeamMemberCertification {
  id: string
  team_member_id: string
  certification_id: string
  issue_date: string
  expiry_date: string
  status: string
  certificate_number: string
  certificate_file_url: string
  notes: string
  certification?: Certification
  team_member?: { id: string; first_name: string; last_name: string }
}

export interface TrainingBudget {
  id: string
  year: number
  budget_amount: number
  currency: string
  team_member_id: string
  team_id: string
  notes: string
  team_member?: { id: string; first_name: string; last_name: string }
}

export interface CourseFormState {
  name: string
  description: string
  category: string
  provider: string
  duration_hours: number
  cost: number
  currency: string
  is_online: boolean
  location: string
  registration_url: string
  is_mandatory: boolean
  recurrence_months: number
  max_participants: number
}

export interface EventFormState {
  title: string
  description: string
  training_course_id: string
  start_date: string
  end_date: string
  start_time: string
  end_time: string
  location: string
  meeting_link: string
  is_online: boolean
  max_participants: number
  cost_per_person: number
  currency: string
  status: string
  notes: string
  team_id: string
}

export interface CertificationFormState {
  name: string
  description: string
  issuing_authority: string
  category: string
  validity_months: number
  is_mandatory: boolean
  reminder_days_before: number
  icon: string
  color: string
}

export const COURSE_CATEGORIES = [
  { value: "fachlich", label: "Fachlich" },
  { value: "software", label: "Software" },
  { value: "kommunikation", label: "Kommunikation" },
  { value: "fuehrung", label: "Führung" },
  { value: "compliance", label: "Compliance" },
  { value: "sicherheit", label: "Sicherheit" },
  { value: "sonstiges", label: "Sonstiges" },
]

export const INITIAL_COURSE_FORM: CourseFormState = {
  name: "",
  description: "",
  category: "fachlich",
  provider: "",
  duration_hours: 0,
  cost: 0,
  currency: "EUR",
  is_online: false,
  location: "",
  registration_url: "",
  is_mandatory: false,
  recurrence_months: 0,
  max_participants: 0,
}

export const INITIAL_EVENT_FORM: EventFormState = {
  title: "",
  description: "",
  training_course_id: "",
  start_date: "",
  end_date: "",
  start_time: "09:00",
  end_time: "17:00",
  location: "",
  meeting_link: "",
  is_online: false,
  max_participants: 20,
  cost_per_person: 0,
  currency: "EUR",
  status: "geplant",
  notes: "",
  team_id: "",
}

export const INITIAL_CERTIFICATION_FORM: CertificationFormState = {
  name: "",
  description: "",
  issuing_authority: "",
  category: "pflicht",
  validity_months: 12,
  is_mandatory: false,
  reminder_days_before: 30,
  icon: "award",
  color: "blue",
}
