export async function api(path, { method = 'GET', body, headers } = {}) {
  const isForm = body instanceof FormData
  const res = await fetch(`/api${path}`, {
    method,
    credentials: 'same-origin',
    headers: body && !isForm ? { 'Content-Type': 'application/json', ...headers } : headers,
    body: body && !isForm ? JSON.stringify(body) : body,
  })
  // Before the API is deployed, Pages answers /api/* with the HTML app shell — treat that as a failure.
  const isJson = (res.headers.get('content-type') || '').includes('application/json')
  const data = isJson ? await res.json().catch(() => ({})) : {}
  if (!res.ok || !isJson) {
    const err = new Error(data.error || `Request failed (${res.status})`)
    err.status = res.status
    throw err
  }
  return data
}

// Project photos are full URLs, uploads served from /media/..., or files in /public.
export function mediaUrl(path) {
  if (!path) return ''
  return /^https?:\/\//i.test(path) || path.startsWith('/') ? path : ''
}

export const isVideoFile = url => /\.(mp4|webm)(\?|$)/i.test(url || '')
