'use client'

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import type { UserResponse, UserLogin, UserRegister } from '@/lib/types'

// Demo mode - simulated user for development without a real API
const DEMO_USER: UserResponse = {
  id: 'demo-user-1',
  email: 'demo@restaurant.com',
  full_name: 'Demo Admin',
  role: 'owner',
  is_active: true,
  created_at: new Date().toISOString(),
}

const IS_DEMO_MODE = !process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL === 'https://api.example.com'

interface AuthContextType {
  user: UserResponse | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (data: UserLogin) => Promise<void>
  register: (data: UserRegister) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
  isDemoMode: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refreshUser = useCallback(async () => {
    if (IS_DEMO_MODE) {
      // In demo mode, check localStorage for demo session
      const demoSession = typeof window !== 'undefined' ? localStorage.getItem('demo_session') : null
      if (demoSession) {
        setUser(DEMO_USER)
      } else {
        setUser(null)
      }
      return
    }

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
      if (!token) {
        setUser(null)
        return
      }
      const { api } = await import('@/lib/api')
      const userData = await api.getCurrentUser()
      setUser(userData)
    } catch {
      setUser(null)
      if (typeof window !== 'undefined') {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
      }
    }
  }, [])

  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true)
      await refreshUser()
      setIsLoading(false)
    }
    initAuth()
  }, [refreshUser])

  const login = async (data: UserLogin) => {
    if (IS_DEMO_MODE) {
      // Demo mode: accept any credentials
      if (typeof window !== 'undefined') {
        localStorage.setItem('demo_session', 'true')
      }
      setUser(DEMO_USER)
      return
    }

    const { api } = await import('@/lib/api')
    await api.login(data)
    await refreshUser()
  }

  const register = async (data: UserRegister) => {
    if (IS_DEMO_MODE) {
      // Demo mode: simulate registration then login
      await login({ email: data.email, password: data.password })
      return
    }

    const { api } = await import('@/lib/api')
    await api.register(data)
    await login({ email: data.email, password: data.password })
  }

  const logout = async () => {
    if (IS_DEMO_MODE) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('demo_session')
      }
      setUser(null)
      return
    }

    const { api } = await import('@/lib/api')
    await api.logout()
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshUser,
        isDemoMode: IS_DEMO_MODE,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
