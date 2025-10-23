"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { getCookie, setCookie, deleteCookie, getUserRole } from '@/lib/auth-utils'

type Role = 'admin' | 'user' | null

interface AuthContextType {
  user: { name: string; token: string } | null
  login: (name: string, token: string) => void
  logout: () => void
  token: string | null
  getUserRole: (username: string) => Promise<Role>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<{ name: string; token: string } | null>(null)

  useEffect(() => {
    try {
      const token = getCookie('srwl_token')
      const userData = getCookie('srwl_user')
      if (token && userData) {
        const parsedUser = JSON.parse(userData)
        setUser({ name: parsedUser.name, token })
      }
    } catch (e) {
      // ignore
    }
  }, [])

  const login = (name: string, token: string) => {
    const u = { name, token }
    setUser(u)
    try { 
      setCookie('srwl_token', token, 7) // Token expires in 7 days
      setCookie('srwl_user', JSON.stringify({ name }), 7)
    } catch (e) {}
  }

  const logout = () => {
    setUser(null)
    try { 
      deleteCookie('srwl_token')
      deleteCookie('srwl_user')
    } catch (e) {}
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, token: user?.token || null, getUserRole }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
