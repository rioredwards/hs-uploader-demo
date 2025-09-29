import { useEffect, useMemo, useState } from 'react'

type ParsedParams = {
  token: string | null
  claimName: string | null
  claimId: string | null
  fullName: string | null
  userId: string | null
}

const KEYS: (keyof ParsedParams)[] = ['token', 'claimName', 'claimId', 'fullName', 'userId']

function getHashSearchParams(loc: Location): URLSearchParams {
  const rawHash = loc.hash.startsWith('#') ? loc.hash.slice(1) : loc.hash
  const hashQuery = rawHash.split('#')[0]
  return new URLSearchParams(hashQuery ? (hashQuery.startsWith('?') ? hashQuery : `?${hashQuery}`) : '')
}

function extractParamsFromLocation(loc: Location): ParsedParams {
  // All query params are expected after the initial '#'.
  // Ignore anything after a second '#', e.g. '#https://app.hubspot.com'.
  const hashParams = getHashSearchParams(loc)

  const result: ParsedParams = {
    token: null,
    claimName: null,
    claimId: null,
    fullName: null,
    userId: null,
  }

  for (const key of KEYS) {
    let value = hashParams.get(key)
    if (value) {
      // Guard against stray fragment pieces in values
      value = value.split('#')[0] || value
    }
    // Assign with proper typing
    ;(result[key] as string | null) = value || null
  }

  return result
}

export default function useQueryParams(): ParsedParams {
  const hasWindow = typeof window !== 'undefined'
  const initial = useMemo<ParsedParams>(() => {
    if (!hasWindow) {
      return { token: null, claimName: null, claimId: null, fullName: null, userId: null }
    }
    return extractParamsFromLocation(window.location)
  }, [hasWindow])

  const [params, setParams] = useState<ParsedParams>(initial)

  useEffect(() => {
    if (!hasWindow) return

    const update = () => {
      setParams(extractParamsFromLocation(window.location))
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

  return params
}
