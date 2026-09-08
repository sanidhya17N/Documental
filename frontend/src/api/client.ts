import axios from 'axios'
import type { ApiResponse } from '@/types'

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1'

export const api = axios.create({
  baseURL: API_BASE,
  headers: {
    Accept: 'application/json',
  },
})

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
    if (error.message) return error.message
  }
  if (error instanceof Error) return error.message
  return 'Something went wrong'
}
