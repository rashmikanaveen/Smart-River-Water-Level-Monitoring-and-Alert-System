"use client"

"use client"

import Link from 'next/link'
import { useAuth } from '@/context/auth-context'

export default function Footer() {
  const { user, logout } = useAuth()
  const year = new Date().getFullYear()

  return (
    <footer className="bg-white rounded-lg shadow-sm m-4">
      <div className="w-full mx-auto max-w-screen-xl p-4 md:flex md:items-center md:justify-between">
        <span className="text-sm text-gray-500 sm:text-center dark:text-gray-400">
          © {year} <a href="/" className="hover:underline">Smart River</a>. All Rights Reserved.
        </span>

        <ul className="flex flex-wrap items-center mt-3 text-sm font-medium text-gray-500 dark:text-gray-400 sm:mt-0">
          
          <li className="flex items-center">
            {user ? (
              <>
                <span className="text-sm mr-3">{user.name} ({user.role})</span>
                <button onClick={logout} className="px-3 py-1 bg-red-100 text-red-800 rounded">Logout</button>
              </>
            ) : (
              <Link href="/login"><button className="px-3 py-1 bg-blue-600 text-white rounded">Login</button></Link>
            )}
          </li>
        </ul>
      </div>
    </footer>
  )
}
