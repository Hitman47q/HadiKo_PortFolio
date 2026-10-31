// Serves files uploaded from /admin, which are stored in the D1 `media` table.
// URLs look like /media/12.webp; only the number is used.
export async function onRequestGet({ request, env, params }) {
  const id = Number(String((params.path || [])[0] || '').split('.')[0])
  if (!Number.isInteger(id) || id < 1) return new Response('Not found', { status: 404 })

  const etag = `"media-${id}"`
  const cacheHeaders = { ETag: etag, 'Cache-Control': 'public, max-age=31536000, immutable' }
  if (request.headers.get('If-None-Match') === etag) return new Response(null, { status: 304, headers: cacheHeaders })

  const row = await env.DB.prepare('SELECT content_type, data FROM media WHERE id = ?').bind(id).first()
  if (!row) return new Response('Not found', { status: 404 })

  return new Response(new Uint8Array(row.data), {
    headers: { ...cacheHeaders, 'Content-Type': row.content_type, 'X-Content-Type-Options': 'nosniff' },
  })
}
