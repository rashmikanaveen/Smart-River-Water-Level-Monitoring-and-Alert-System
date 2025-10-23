"use client"

import { useState, useEffect } from 'react'
import AxiosInstance from '@/lib/axios-instance'
import { useAuth } from '@/context/auth-context'
import Link from 'next/link'
import { redirect } from "next/navigation"

export default function AdminPage() {
  const { user, getUserRole } = useAuth()
  const [form, setForm] = useState({ username: '', email: '', password: '', full_name: '' })
  const [status, setStatus] = useState<{ type: 'success'|'error', message: string } | null>(null)
  const [isCheckingRole, setIsCheckingRole] = useState(true)
  const [userRole, setUserRole] = useState<'admin' | 'user' | null>(null)
  const [loading, setLoading] = useState(false)

  // Fetch user role from backend on mount
  useEffect(() => {
    const checkRole = async () => {
      if (user?.name) {
        const role = await getUserRole(user.name)
        setUserRole(role)
      }
      setIsCheckingRole(false)
    }
    checkRole()
  }, [user?.name, getUserRole])

  // Show loading while checking role
  if (isCheckingRole) {
    return (
      <div className="p-12 text-center">
        <p className="text-gray-500">Checking permissions...</p>
      </div>
    )
  }

  if (!user || userRole !== 'admin') {
    redirect('/login');
  }

  const submit = async (e: any) => {
    e.preventDefault()
    setStatus(null)
    setLoading(true)
    try {
      const res = await AxiosInstance.post('/api/auth/register', form)
      setStatus({ type: 'success', message: res.data?.message || 'User created successfully' })
      setForm({ username: '', email: '', password: '', full_name: '' })
    } catch (err: any) {
      console.error('Registration error:', err)
      setStatus({ type: 'error', message: err.response?.data?.detail || 'Registration failed. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto mt-8 p-6 bg-white rounded shadow">
      <h1 className="text-2xl font-semibold mb-4">Admin - Create User</h1>
      {status && (
        <div className={`p-3 mb-4 rounded ${status.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {status.message}
        </div>
      )}
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-sm text-gray-700 mb-1">Username</label>
          <input 
            className="w-full border px-3 py-2 rounded" 
            value={form.username} 
            onChange={e => setForm({...form, username: e.target.value})} 
            required
            disabled={loading}
          />
        </div>
        <div>
          <label className="block text-sm text-gray-700 mb-1">Email</label>
          <input 
            type="email"
            className="w-full border px-3 py-2 rounded" 
            value={form.email} 
            onChange={e => setForm({...form, email: e.target.value})} 
            required
            disabled={loading}
          />
        </div>
        <div>
          <label className="block text-sm text-gray-700 mb-1">Full name</label>
          <input 
            className="w-full border px-3 py-2 rounded" 
            value={form.full_name} 
            onChange={e => setForm({...form, full_name: e.target.value})} 
            required
            disabled={loading}
          />
        </div>
        <div>
          <label className="block text-sm text-gray-700 mb-1">Password</label>
          <input 
            type="password" 
            className="w-full border px-3 py-2 rounded" 
            value={form.password} 
            onChange={e => setForm({...form, password: e.target.value})} 
            required
            disabled={loading}
          />
        </div>
        <div className="flex justify-end">
          <button 
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? 'Creating...' : 'Create User'}
          </button>
        </div>
      </form>
    </div>
  )
}
