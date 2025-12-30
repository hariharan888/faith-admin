// Matrimony Profile types matching church-api model
export interface MatrimonyProfile {
  id: number
  product_user_id: number
  profile_status: "draft" | "pending_approval" | "approved" | "rejected"
  visibility_status: "active" | "inactive" | "deactivated"
  
  // Personal Details
  profile_created_for?: string
  name: string
  about?: string
  gender: "Male" | "Female"
  date_of_birth: string
  age?: number
  marital_status?: string
  education?: string
  job_type?: string
  job_title?: string
  income?: string
  height?: string
  weight?: string
  complexion?: string
  mobile_number?: string
  native_place?: string
  mother_tongue?: string
  
  // Family Details
  father_name?: string
  father_occupation?: string
  mother_name?: string
  mother_occupation?: string
  family_type?: string
  current_address?: {
    street?: string
    city?: string
    state?: string
    pincode?: string
  }
  younger_brothers?: number
  younger_sisters?: number
  elder_brothers?: number
  elder_sisters?: number
  younger_brothers_married?: number
  younger_sisters_married?: number
  elder_brothers_married?: number
  elder_sisters_married?: number
  
  // Spiritual Details
  are_you_saved?: boolean
  are_you_baptized?: boolean
  are_you_anointed?: boolean
  church_name?: string
  denomination?: string
  pastor_name?: string
  pastor_mobile_number?: string
  church_address?: {
    street?: string
    city?: string
    state?: string
    pincode?: string
  }
  
  // Partner Preferences
  ex_min_age?: number
  ex_max_age?: number
  ex_education?: string
  ex_job_type?: string
  ex_income?: string
  ex_complexion?: string
  ex_other_details?: string
  
  // System fields
  profile_picture_index?: number
  payment_status?: string
  last_active_at?: string
  created_at: string
  updated_at: string
}

export interface MatrimonyProfileFormData {
  name: string
  gender: "Male" | "Female"
  date_of_birth: string
  marital_status?: string
  education?: string
  job_type?: string
  job_title?: string
  income?: string
  height?: string
  weight?: string
  complexion?: string
  mobile_number?: string
  native_place?: string
  mother_tongue?: string
  about?: string
  profile_created_for?: string
  father_name?: string
  father_occupation?: string
  mother_name?: string
  mother_occupation?: string
  family_type?: string
  current_address?: {
    street?: string
    city?: string
    state?: string
    pincode?: string
  }
  younger_brothers?: number
  younger_sisters?: number
  elder_brothers?: number
  elder_sisters?: number
  are_you_saved?: boolean
  are_you_baptized?: boolean
  are_you_anointed?: boolean
  church_name?: string
  denomination?: string
  pastor_name?: string
  pastor_mobile_number?: string
  church_address?: {
    street?: string
    city?: string
    state?: string
    pincode?: string
  }
  ex_min_age?: number
  ex_max_age?: number
  ex_education?: string
  ex_job_type?: string
  ex_income?: string
  ex_complexion?: string
  ex_other_details?: string
}
