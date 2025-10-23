import AxiosInstance from './axios-instance'

/**
 * Helper function to get cookie value
 */
export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const nameEQ = name + "="
  const ca = document.cookie.split(';')
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i]
    while (c.charAt(0) === ' ') c = c.substring(1, c.length)
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length)
  }
  return null
}

/**
 * Helper function to set cookie
 */
export function setCookie(name: string, value: string, days: number = 7) {
  const expires = new Date()
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000)
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Strict`
}

/**
 * Helper function to delete cookie
 */
export function deleteCookie(name: string) {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`
}

/**
 * Get user role from backend API
 * @param username - The username to get the role for
 * @returns Promise with role ('admin' | 'user') or null if error
 */
export async function getUserRole(username: string): Promise<'admin' | 'user' | null> {
  try {
    const response = await AxiosInstance.get(`/api/users/role/${username}`)
    const isAdmin = response.data?.is_admin ?? false
    return isAdmin ? 'admin' : 'user'
  } catch (error) {
    console.error('Error fetching user role:', error)
    return null
  }
}

/**
 * Get username from cookie
 * @returns username or null
 */
export function getUsernameFromCookie(): string | null {
  const userData = getCookie('srwl_user')
  if (userData) {
    try {
      const parsed = JSON.parse(userData)
      return parsed.name || null
    } catch (e) {
      return null
    }
  }
  return null
}
