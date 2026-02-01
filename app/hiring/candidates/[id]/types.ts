export interface CandidateEvent {
  id: string
  type: 'interview_1' | 'interview_2' | 'trial_day_1' | 'trial_day_2' | 'other'
  date: string
  time?: string
  notes?: string
  completed: boolean
  created_at: string
}

export interface CandidateDetails {
  candidate: Candidate
  applications: Application[]
  interviews: Interview[]
}

export interface Candidate {
  id: string
  first_name: string
  last_name: string
  email: string
  phone?: string
  mobile?: string
  address?: string
  postal_code?: string
  city?: string
  country?: string
  status: string
  rating?: number
  image_url?: string
  current_position?: string
  current_company?: string
  years_of_experience?: number
  date_of_birth?: string
  weekly_hours?: number
  salary_expectation?: number
  availability_date?: string
  source?: string
  first_contact_date?: string
  created_at?: string
  education?: string
  skills?: string[]
  languages?: string[]
  certifications?: string[]
  cover_letter?: string
  resume_url?: string
  portfolio_url?: string
  linkedin_url?: string
  documents?: Document[]
  notes?: string
  events?: CandidateEvent[]
}

export interface Document {
  name?: string
  filename?: string
  url: string
  type?: string
  size?: number
  uploadedAt?: string
}

export interface Application {
  id: string
  status: string
  stage?: string
  applied_at: string
  job_postings?: {
    title: string
    department?: string
  }
}

export interface Interview {
  id: string
  scheduled_at: string
  type: string
  status: string
}
