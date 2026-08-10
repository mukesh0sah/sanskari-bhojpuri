import { useEffect, useState } from 'react'

const SESSION_KEY = 'bhojpuri-radio-visit'

/**
 * Loads the site-wide visit total from the Netlify function.
 * Counts once per browser session so a refresh does not inflate the number.
 */
export function useVisitCount(): number | null {
  const [visits, setVisits] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false

    const alreadyCounted = sessionStorage.getItem(SESSION_KEY) === '1'
    const url = alreadyCounted ? '/api/visits?peek=1' : '/api/visits'

    fetch(url)
      .then((response) => {
        if (!response.ok) throw new Error(`visits ${response.status}`)
        return response.json() as Promise<{ visits?: unknown }>
      })
      .then((data) => {
        if (cancelled || typeof data.visits !== 'number') return
        setVisits(data.visits)
        sessionStorage.setItem(SESSION_KEY, '1')
      })
      .catch(() => {
        // Local Vite has no Netlify function; leave the counter blank.
      })

    return () => {
      cancelled = true
    }
  }, [])

  return visits
}
