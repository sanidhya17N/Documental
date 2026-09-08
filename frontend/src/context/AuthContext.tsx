import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  clearAuth,
  fetchMe,
  getStoredToken,
  getStoredUser,
  login as loginApi,
  persistAuth,
  signup as signupApi,
} from '@/api/auth'
import type { AuthUser, LoginRequest, SignupRequest } from '@/types/auth'

interface AuthContextValue {
  user: AuthUser | null
  token: string | null
  isAuthenticated: boolean
  login: (payload: LoginRequest) => Promise<void>
  signup: (payload: SignupRequest) => Promise<void>
  logout: () => void
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => getStoredToken())
  const [user, setUser] = useState<AuthUser | null>(() => getStoredUser())

  const login = useCallback(async (payload: LoginRequest) => {
    const data = await loginApi(payload)
    persistAuth(data)
    setToken(data.token)
    setUser({ id: data.userId, email: data.email, fullName: data.fullName })
  }, [])

  const signup = useCallback(async (payload: SignupRequest) => {
    const data = await signupApi(payload)
    persistAuth(data)
    setToken(data.token)
    setUser({ id: data.userId, email: data.email, fullName: data.fullName })
  }, [])

  const logout = useCallback(() => {
    clearAuth()
    setToken(null)
    setUser(null)
  }, [])

  const refreshProfile = useCallback(async () => {
    if (!getStoredToken()) return
    const me = await fetchMe()
    setUser(me)
    localStorage.setItem('documental-user', JSON.stringify(me))
  }, [])

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token && user),
      login,
      signup,
      logout,
      refreshProfile,
    }),
    [user, token, login, signup, logout, refreshProfile],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
