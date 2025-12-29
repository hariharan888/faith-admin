export interface ChurchMember {
  id: number
  membership_number: string
  name: string
  father_husband_name?: string
  occupation?: string
  gender?: "male" | "female" | "other"
  marital_status?: "single" | "married" | "widowed" | "divorced"
  address_line_1?: string
  address_line_2?: string
  city?: string
  state?: string
  pincode?: string
  country?: string
  current_residence_same_as_address: boolean
  current_address?: {
    street?: string
    city?: string
    state?: string
    pincode?: string
    country?: string
  }
  mobile_number?: string
  date_of_birth?: string
  marriage_date?: string
  member_since_year?: number
  baptized_year?: number
  spiritual_status?: string
  membership_added_on?: string
  created_at: string
  updated_at: string
}

export interface ChurchMemberFormData {
  membership_number: string
  name: string
  father_husband_name?: string
  occupation?: string
  gender?: string
  marital_status?: string
  address_line_1?: string
  address_line_2?: string
  city?: string
  state?: string
  pincode?: string
  country?: string
  current_residence_same_as_address: boolean
  current_address?: {
    street?: string
    city?: string
    state?: string
    pincode?: string
    country?: string
  }
  mobile_number?: string
  date_of_birth?: string
  marriage_date?: string
  member_since_year?: number
  baptized_year?: number
  spiritual_status?: string
}

export interface MemberTableFilters {
  search: string
  gender?: string
  marital_status?: string
  spiritual_status?: string
}

