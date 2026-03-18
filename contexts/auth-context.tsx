'use client'

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import type { UserResponse, UserLogin, UserRegister } from '@/lib/types'

interface AuthContextType {
  user: UserResponse | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (data: UserLogin) => Promise<void>
  register: (data: UserRegister) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refreshUser = useCallback(async () => {
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
    const { api } = await import('@/lib/api')
    const response = await api.login(data)
    // Backend returns user in token response
    if (response.user) {
      setUser(response.user)
    } else {
      await refreshUser()
    }
  }

  const register = async (data: UserRegister) => {
    const { api } = await import('@/lib/api')
    await api.register(data)
    await login({ email: data.email, password: data.password })
  }

  const logout = async () => {
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
