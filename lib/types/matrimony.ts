export interface MatrimonyProfile {
  id: number
  user_id: number
  name: string
  gender: "male" | "female"
  date_of_birth: string
  height?: string
  weight?: string
  education?: string
  occupation?: string
  income?: string
  marital_status: "never_married" | "divorced" | "widowed"
  religion?: string
  caste?: string
  mother_tongue?: string
  city?: string
  state?: string
  country?: string
  about_me?: string
  partner_preferences?: string
  profile_photo_url?: string
  profile_status: "pending_approval" | "approved" | "rejected"
  rejection_reason?: string
  created_at: string
  updated_at: string
}

