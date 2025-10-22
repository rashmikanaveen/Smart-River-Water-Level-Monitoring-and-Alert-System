"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

type Role = 'admin' | 'user' | null

interface AuthContextType {
  user: { name: string; role: Role } | null
  login: (name: string, role: Role) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<{ name: string; role: Role } | null>(null)

  useEffect(() => {
    try {
      const raw = localStorage.getItem('srwl_user')
      if (raw) setUser(JSON.parse(raw))
    } catch (e) {
      // ignore
    }
  }, [])

  const login = (name: string, role: Role) => {
    const u = { name, role }
    setUser(u)
    try { localStorage.setItem('srwl_user', JSON.stringify(u)) } catch (e) {}
  }

  const logout = () => {
    setUser(null)
    try { localStorage.removeItem('srwl_user') } catch (e) {}
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
