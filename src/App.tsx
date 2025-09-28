import { useEffect, useState } from 'react'
import './App.css'

function App() {
  const [message, setMessage] = useState<string>('Loading...')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/hello')
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const text = await res.text()
        if (!cancelled) setMessage(text)
      } catch (e: unknown) {
        if (!cancelled) setError((e as Error).message)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <>
      <h1>React + Firebase Functions</h1>
      {error ? (
        <p role="alert">Error: {error}</p>
      ) : (
        <p id="hello">{message}</p>
      )}
      <section style={{ marginTop: 24 }}>
        <h2>Request Info</h2>
        <p>
          <strong>URL:</strong> {typeof window !== 'undefined' ? window.location.href : 'N/A'}
        </p>
        <div>
          <strong>URLSearchParams:</strong>
          {typeof window !== 'undefined' ? (
            (() => {
              // Extract the query portion from the hash (before any subsequent '#')
              const rawHash = window.location.hash.startsWith('#')
                ? window.location.hash.slice(1)
                : window.location.hash
              const hashQuery = rawHash.split('#')[0] // e.g. "?code=69"

              // Ensure we pass a proper query string to URLSearchParams
              const params = new URLSearchParams(
                hashQuery ? (hashQuery.startsWith('?') ? hashQuery : `?${hashQuery}`) : ''
              )

              // Try to read code from the hash query first
              let code = params.get('code') || null

              // Fallback: try standard search params if not found in hash
              if (!code && window.location.search) {
                const searchParams = new URLSearchParams(window.location.search)
                code = searchParams.get('code')
              }

              // Final cleanup: ensure we only keep the raw code value
              if (code) {
                code = code.split('#')[0] || code
              }

              return <p>code: {code ?? 'N/A'}</p>
            })()
          ) : (
            <div>N/A</div>
          )}
        </div>
      </section>
    </>
  )
}

export default App
