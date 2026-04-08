export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

const DEFAULT_API_URL = 'http://localhost:8080'

function buildUrl(path: string) {
  const baseUrl = import.meta.env.VITE_API_URL?.trim() || DEFAULT_API_URL
  return `${baseUrl}${path}`
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  body?: unknown
  token?: string | null
}

export async function apiRequest<TResponse>(
  path: string,
  options: RequestOptions = {},
): Promise<TResponse> {
  const response = await fetch(buildUrl(path), {
    method: options.method ?? 'GET',
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  })

  if (!response.ok) {
    let message = 'Die Anfrage konnte nicht verarbeitet werden.'

    try {
      const errorBody = (await response.json()) as { message?: string }
      if (errorBody.message) {
        message = errorBody.message
      }
    } catch {
      const errorText = await response.text()
      if (errorText) {
        message = errorText
      }
    }

    throw new ApiError(message, response.status)
  }

  if (response.status === 204) {
    return undefined as TResponse
  }

  const contentLength = response.headers.get('content-length')
  if (contentLength === '0') {
    return undefined as TResponse
  }

  const responseText = await response.text()
  if (!responseText) {
    return undefined as TResponse
  }

  return JSON.parse(responseText) as TResponse
}
