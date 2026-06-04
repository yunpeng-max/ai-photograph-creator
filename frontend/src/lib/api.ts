import type {
  User,
  GenerationRequest,
  GenerationResponse,
  GenerationListResponse,
  FormOptions,
  PointsResponse,
} from './types'

const API_BASE = '/api/v1'

let token: string | null = null

export function setAuthToken(t: string | null) {
  token = t
}

export function getAuthToken(): string | null {
  return token
}

function headers(includeAuth: boolean): Record<string, string> {
  const h: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (includeAuth && token) {
    h['Authorization'] = `Bearer ${token}`
  }
  return h
}

async function request<T>(
  path: string,
  options: {
    method?: string
    body?: unknown
    auth?: boolean
  } = {}
): Promise<T> {
  const { method = 'GET', body, auth = false } = options
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: headers(auth),
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!res.ok) {
    const err = (await res.json().catch(() => ({ detail: 'Network error' }))) as {
      detail: string
      code?: string
    }
    const error = new Error(err.detail) as Error & { status: number; code?: string }
    error.status = res.status
    error.code = err.code
    throw error
  }

  return res.json() as Promise<T>
}

// Auth
export const api = {
  register: (body: { email: string; password: string; nickname: string }) =>
    request<{ token: string; user: User }>('/auth/register', {
      method: 'POST',
      body,
    }),

  login: (body: { email: string; password: string }) =>
    request<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body,
    }),

  me: () =>
    request<User>('/auth/me', { auth: true }),

  updateMe: (body: { nickname?: string; locale?: string }) =>
    request<User>('/auth/me', {
      method: 'PATCH',
      body,
      auth: true,
    }),

  // Generation
  generate: (body: GenerationRequest) =>
    request<GenerationResponse>('/generate', {
      method: 'POST',
      body,
      auth: true,
    }),

  getGeneration: (id: string) =>
    request<GenerationResponse>(`/generate/${id}`, { auth: true }),

  getGenerations: (page = 1, size = 20) =>
    request<GenerationListResponse>(
      `/generate?page=${page}&size=${size}`,
      { auth: true }
    ),

  // Points
  getPoints: () =>
    request<PointsResponse>('/points', { auth: true }),

  purchasePoints: (plan: string) =>
    request<{ message: string }>('/points/purchase', {
      method: 'POST',
      body: { plan },
      auth: true,
    }),

  // Options
  getOptions: () =>
    request<FormOptions>('/options'),
}
