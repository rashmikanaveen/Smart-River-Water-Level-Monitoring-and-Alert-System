"use client"

import { useState } from 'react'
import AxiosInstance from '@/lib/axios-instance'
import { useAuth } from '@/context/auth-context'
import Link from 'next/link'

export default function AdminPage() {
  const { user } = useAuth()
  const [form, setForm] = useState({ username: '', email: '', password: '', full_name: '' })
  const [status, setStatus] = useState<{ type: 'success'|'error', message: string } | null>(null)

  if (!user || user.role !== 'admin') {
    return (
      <div className="p-12 text-center">
        <h2 className="text-2xl font-semibold mb-4">Admin area</h2>
        <p>You need to be an admin to access this page.</p>
        <Link href="/login"><button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded">Go to Login</button></Link>
      </div>
    )
  }

  const submit = async (e: any) => {
    e.preventDefault()
    setStatus(null)
    try {
      const res = await AxiosInstance.post('/api/auth/register', form)
      setStatus({ type: 'success', message: res.data?.message || 'User created' })
      setForm({ username: '', email: '', password: '', full_name: '' })
    } catch (err: any) {
      setStatus({ type: 'error', message: err.response?.data?.detail || 'Registration failed' })
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
          <label className="block text-sm text-gray-700">Username</label>
          <input className="w-full border px-3 py-2 rounded" value={form.username} onChange={e => setForm({...form, username: e.target.value})} />
        </div>
        <div>
          <label className="block text-sm text-gray-700">Email</label>
          <input className="w-full border px-3 py-2 rounded" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
        </div>
        <div>
          <label className="block text-sm text-gray-700">Full name</label>
          <input className="w-full border px-3 py-2 rounded" value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} />
        </div>
        <div>
          <label className="block text-sm text-gray-700">Password</label>
          <input type="password" className="w-full border px-3 py-2 rounded" value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
        </div>
        <div className="flex justify-end">
          <button className="px-4 py-2 bg-blue-600 text-white rounded">Create User</button>
        </div>
      </form>
    </div>
  )
}
