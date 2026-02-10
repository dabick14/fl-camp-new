import axios, { AxiosInstance, AxiosError } from 'axios'
import { auth } from '@/firebase'

interface ImportMetaEnv {
  VITE_API_BASE_URL?: string
  VITE_API_TIMEOUT?: string
}

interface ImportMeta {
  env: ImportMetaEnv
}

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'
const API_TIMEOUT = parseInt(import.meta.env.VITE_API_TIMEOUT || '10000')

export class APIClient {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: API_TIMEOUT,
    })

    // Add request interceptor to inject Firebase ID token
    this.client.interceptors.request.use(
      async (config) => {
        try {
          const idToken = await auth.currentUser?.getIdToken()
          if (idToken) {
            config.headers.Authorization = `Bearer ${idToken}`
          }
        } catch (error) {
          console.error('Failed to get ID token:', error)
        }
        return config
      },
      (error) => Promise.reject(error),
    )

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        // Handle 401 - token expired or invalid
        if (error.response?.status === 401) {
          // Optionally: redirect to login, refresh token, etc.
          console.error('Unauthorized request')
        }
        return Promise.reject(error)
      },
    )
  }

  getInstance() {
    return this.client
  }
}

export const apiClient = new APIClient()
export default apiClient.getInstance()
