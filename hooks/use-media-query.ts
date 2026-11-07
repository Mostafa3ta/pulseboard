'use client'

import { useEffect, useState } from 'react'

/** Tracks a CSS media query. `initial` is used until the browser answers, so pick the common case. */
export function useMediaQuery(query: string, initial = false): boolean {
  const [matches, setMatches] = useState(initial)
  useEffect(() => {
    const media = window.matchMedia(query)
    const update = () => setMatches(media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [query])
  return matches
}
