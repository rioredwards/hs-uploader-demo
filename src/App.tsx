import { useEffect, useState } from 'react'
import './App.css'
import UploadWidget from './components/upload/UploadWidget'
import useCodeFromHash from './hooks/useCodeFromHash'

function App() {
  const [message, setMessage] = useState<string>('Loading...')
  const [error, setError] = useState<string | null>(null)
  const code = useCodeFromHash()

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
          <p>code: {code ?? 'N/A'}</p>
        </div>
      </section>
      <UploadWidget
        uploadUrl="URL"
        token="1234567890"
        claimName="Test Claim"
        claimId="1234567890"
        fullName="Test Full Name"
        userId="1234567890"
      />
    </>
  )
}

export default App
