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
    </>
  )
}

export default App
