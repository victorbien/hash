import { createContext } from 'react'
import type { User } from '@supabase/supabase-js'

export type VolunteerStatus =
  | 'draft'
  | 'submitted'
  | 'pending_review'
  | 'approved'
  | 'additional_information_required'
  | 'not_approved'
  | 'inactive'
  | 'suspended'

export type VolunteerProfile = {
  id: string
  first_name: string
  last_name: string
  preferred_name: string | null
  pronouns: string | null
  phone: string | null
  preferred_contact_method: string | null
  location: string | null
  preferred_language: string | null
}

export type VolunteerApplication = {
  id: string
  status: VolunteerStatus
  interests: string[]
  availability: Record<string, unknown>
  skills: string | null
  experience: string | null
  motivation: string | null
  submitted_at: string | null
}

export type AuthContextValue = {
  user: User | null
  profile: VolunteerProfile | null
  application: VolunteerApplication | null
  loading: boolean
  configured: boolean
  error: string | null
  sessionError: string | null
  refreshVolunteerData: () => Promise<void>
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
