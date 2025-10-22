"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/auth-context'

export default function LoginPage() {
  const [name, setName] = useState('Admin')
  const [role, setRole] = useState<'admin'|'user'>('admin')
  const { login } = useAuth()
  const router = useRouter()

  const submit = (e: any) => {
    e.preventDefault()
    login(name, role)
    router.push('/')
  }

  return (
    <div className="max-w-md mx-auto mt-20 p-6 bg-white rounded shadow">
      <h1 className="text-2xl font-semibold mb-4">Sign in</h1>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-sm text-gray-700">Name</label>
          <input value={name} onChange={e => setName(e.target.value)} className="w-full border px-3 py-2 rounded" />
        </div>
        <div>
          <label className="block text-sm text-gray-700">Role</label>
          <select value={role} onChange={e => setRole(e.target.value as any)} className="w-full border px-3 py-2 rounded">
            <option value="admin">Admin</option>
            <option value="user">User</option>
          </select>
        </div>
        <div className="flex justify-end">
          <button className="px-4 py-2 bg-blue-600 text-white rounded">Sign in</button>
        </div>
      </form>
    </div>
  )
}
