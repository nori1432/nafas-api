import { create } from 'zustand'

export type Role =
  | 'citizen' | 'doctor' | 'engineer' | 'donor'
  | 'hospital_admin' | 'national_admin' | 'maintenance_company'

export interface User {
  id: number
  full_name: string
  phone_number: string
  role: Role
  hospital_id: number | null
  is_verified: boolean
  is_active: boolean
}

interface AuthState {
  user: User | null
  token: string | null
  hydrated: boolean
  setSession: (u: User, t: string) => void
  clear: () => void
  hydrate: () => void
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  token: null,
  hydrated: false,
  setSession: (u, t) => {
    localStorage.setItem('nafas_token', t)
    localStorage.setItem('nafas_user', JSON.stringify(u))
    set({ user: u, token: t, hydrated: true })
  },
  clear: () => {
    localStorage.removeItem('nafas_token')
    localStorage.removeItem('nafas_user')
    set({ user: null, token: null, hydrated: true })
  },
  hydrate: () => {
    const t = localStorage.getItem('nafas_token')
    const raw = localStorage.getItem('nafas_user')
    if (t && raw) {
      try { set({ token: t, user: JSON.parse(raw), hydrated: true }); return }
      catch { /* fallthrough */ }
    }
    set({ hydrated: true })
  },
}))
