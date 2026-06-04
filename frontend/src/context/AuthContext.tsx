import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import type { User } from '../lib/types'
import { api, setAuthToken } from '../lib/api'

interface AuthContextType {
  user: User | null
  token: string | null
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, nickname: string) => Promise<void>
  logout: () => void
  updateBalance: (newBalance: number) => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(
    typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null
  )
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('token')
      if (storedToken) {
        try {
          setAuthToken(storedToken)
          const userData = await api.me()
          setToken(storedToken)
          setUser(userData)
        } catch (e) {
          localStorage.removeItem('token')
          setAuthToken(null)
          setToken(null)
          setUser(null)
        }
      }
      setIsLoading(false)
    }
    initAuth()
  }, [])

  const login = async (email: string, password: string) => {
    const response = await api.login({ email, password })
    setAuthToken(response.token)
    setToken(response.token)
    setUser(response.user)
    localStorage.setItem('token', response.token)
  }

  const register = async (email: string, password: string, nickname: string) => {
    const response = await api.register({ email, password, nickname })
    setAuthToken(response.token)
    setToken(response.token)
    setUser(response.user)
    localStorage.setItem('token', response.token)
  }

  const logout = () => {
    setAuthToken(null)
    setToken(null)
    setUser(null)
    localStorage.removeItem('token')
  }

  const updateBalance = (newBalance: number) => {
    setUser((prev) => prev ? { ...prev, points_balance: newBalance } : prev)
  }

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, updateBalance, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
