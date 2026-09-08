export interface AuthUser {
  id: string
  email: string
  fullName: string
}

export interface AuthResponse {
  token: string
  tokenType: string
  userId: string
  email: string
  fullName: string
}

export interface SignupRequest {
  fullName: string
  email: string
  password: string
}

export interface LoginRequest {
  email: string
  password: string
}
