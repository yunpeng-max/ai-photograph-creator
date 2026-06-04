// User
export interface User {
  id: string
  email: string
  nickname: string
  points_balance: number
  locale: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  nickname: string
}

export interface AuthResponse {
  token: string
  user: User
}

// Generation
export interface GenerationRequest {
  image_type: string
  aspect_ratio: string
  style: string
  scene: string
  whitespace: string
  subject: string
  additional_requirements?: string
}

export interface GenerationResponse {
  id: string
  status: 'pending' | 'completed' | 'failed'
  image_type: string
  aspect_ratio: string
  style: string
  scene: string
  whitespace: string
  subject: string
  additional_requirements?: string
  assembled_prompt: string
  image_url?: string
  cost_points: number
  points_balance_after: number
  created_at: string
}

export interface GenerationListResponse {
  items: GenerationResponse[]
  total: number
  page: number
  size: number
}

// Points
export interface PointTransaction {
  id: string
  change_amount: number
  balance_after: number
  reason: string
  related_generation_id?: string
  created_at: string
}

export interface PointsResponse {
  balance: number
  transactions: PointTransaction[]
}

// Options
export interface OptionItem {
  key: string
  label_zh: string
  label_en: string
}

export interface FormOptions {
  image_types: OptionItem[]
  aspect_ratios: OptionItem[]
  styles: OptionItem[]
  scenes: OptionItem[]
  whitespaces: OptionItem[]
}

// Common
export interface ApiError {
  detail: string
  code?: string
}

export interface UpdateUserRequest {
  nickname?: string
  locale?: string
}
