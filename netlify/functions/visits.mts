import type { Config, Context } from '@netlify/functions'
import { getStore } from '@netlify/blobs'

/**
 * Atomic-enough visit counter backed by Netlify Blobs.
 * POST/GET /api/visits        → increment and return the new total
 * GET     /api/visits?peek=1  → return the total without incrementing
 */
export default async (request: Request, _context: Context) => {
  const store = getStore('stats')
  const peek = new URL(request.url).searchParams.get('peek') === '1'

  const raw = await store.get('total-visits')
  let visits = Number(raw) || 0

  if (!peek) {
    visits += 1
    await store.set('total-visits', String(visits))
  }

  return Response.json(
    { visits },
    {
      headers: {
        'Cache-Control': 'no-store',
      },
    },
  )
}

export const config: Config = {
  path: '/api/visits',
}
