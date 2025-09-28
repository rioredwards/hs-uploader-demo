import { useEffect, useMemo, useState } from 'react'

function extractCodeFromLocation(loc: Location): string | null {
  const rawHash = loc.hash.startsWith('#') ? loc.hash.slice(1) : loc.hash
  const hashQuery = rawHash.split('#')[0]

  const params = new URLSearchParams(
    hashQuery ? (hashQuery.startsWith('?') ? hashQuery : `?${hashQuery}`) : ''
  )

  let code = params.get('code') || null

  if (!code && loc.search) {
    const searchParams = new URLSearchParams(loc.search)
    code = searchParams.get('code')
  }

  if (code) {
    code = code.split('#')[0] || code
  }

  return code
}

export default function useCodeFromHash(): string | null {
  const hasWindow = typeof window !== 'undefined'
  const initial = useMemo(() => {
    if (!hasWindow) return null
    return extractCodeFromLocation(window.location)
  }, [hasWindow])

  const [code, setCode] = useState<string | null>(initial)

  useEffect(() => {
    if (!hasWindow) return

    const update = () => {
      setCode(extractCodeFromLocation(window.location))
    }

    // Update on navigation or hash changes
    window.addEventListener('hashchange', update)
    window.addEventListener('popstate', update)

    // Ensure state is fresh on mount
    update()

    return () => {
      window.removeEventListener('hashchange', update)
      window.removeEventListener('popstate', update)
    }
  }, [hasWindow])

  return code
}

