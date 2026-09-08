import axios from 'axios'
import type { ApiResponse } from '@/types'
import { clearAuth, getStoredToken } from './auth'

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1'

export const api = axios.create({
  baseURL: API_BASE,
  headers: {
    Accept: 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = getStoredToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      const url = error.config?.url || ''
      if (!url.includes('/auth/login') && !url.includes('/auth/signup')) {
        clearAuth()
        if (!window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/signup')) {
          window.location.assign('/login')
        }
      }
    }
    return Promise.reject(error)
  },
)

export function unwrap<T>(response: { data: ApiResponse<T> }): T {
  const body = response.data
  if (!body.success) {
    throw new Error(body.message || 'Request failed')
  }
  return body.data
}

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as ApiResponse<unknown> | undefined
    if (data?.message) return data.message
    if (error.response?.status === 401) return 'Session expired — please sign in again'
    if (error.response?.status === 403) return 'Access denied'
    if (error.code === 'ERR_NETWORK') {
      return 'Could not reach the server. Check that the backend is running.'
    }
    if (error.message) return error.message
  }
  if (error instanceof TypeError && /fetch|network/i.test(error.message)) {
    return 'Could not reach the server. Check that the backend is running.'
  }
  if (error instanceof Error) return error.message
  return 'Something went wrong'
}

export function getAuthHeader(): Record<string, string> {
  const token = getStoredToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export { API_BASE }
