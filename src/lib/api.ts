import axios from 'axios'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api',
  timeout: 20000,
})

api.interceptors.request.use((cfg) => {
  const token = localStorage.getItem('nafas_token')
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('nafas_token')
      localStorage.removeItem('nafas_user')
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login'
      }
    }
    return Promise.reject(err)
  },
)

export type ApiEnvelope<T> = {
  success: boolean
  message: string
  data: T
  pagination?: { page: number; per_page: number; total: number; pages: number }
}
