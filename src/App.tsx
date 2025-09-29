import { useEffect, useState } from 'react'
import './App.css'
import UploadWidget from './components/upload/UploadWidget'
import useQueryParams from './hooks/useQueryParams'

function App() {
  const [message, setMessage] = useState<string>('Loading...')
  const [error, setError] = useState<string | null>(null)
  const { token, claimName, claimId, fullName, userId } = useQueryParams()
  const allParamsPresent = Boolean(token && claimName && claimId && fullName && userId)

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
      {allParamsPresent ? (
        <UploadWidget
          uploadUrl="URL"
          token={token as string}
          claimName={claimName as string}
          claimId={claimId as string}
          fullName={fullName as string}
          userId={userId as string}
        />
      ) : (
        <div role="alert" style={{ marginTop: 16 }}>
          <p>This page is not available.</p>
          <p>Please open the original secure link or contact support.</p>
        </div>
      )}
    </>
  )
}

export default App
