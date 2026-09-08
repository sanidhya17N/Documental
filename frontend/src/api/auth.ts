import { api, unwrap } from './client'
import type { AuthResponse, AuthUser, LoginRequest, SignupRequest } from '@/types/auth'

const TOKEN_KEY = 'documental-token'
const USER_KEY = 'documental-user'

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function getStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? (JSON.parse(raw) as AuthUser) : null
  } catch {
    return null
  }
}

export function persistAuth(data: AuthResponse) {
  localStorage.setItem(TOKEN_KEY, data.token)
  localStorage.setItem(
    USER_KEY,
    JSON.stringify({
      id: data.userId,
      email: data.email,
      fullName: data.fullName,
    } satisfies AuthUser),
  )
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

export async function signup(payload: SignupRequest): Promise<AuthResponse> {
  const res = await api.post('/auth/signup', payload)
  return unwrap<AuthResponse>(res)
}

export async function login(payload: LoginRequest): Promise<AuthResponse> {
  const res = await api.post('/auth/login', payload)
  return unwrap<AuthResponse>(res)
}

export async function fetchMe(): Promise<AuthUser> {
  const res = await api.get('/auth/me')
  return unwrap<AuthUser>(res)
}
