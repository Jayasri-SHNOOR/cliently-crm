import { useCallback, useEffect, useRef, useState } from 'react'

export default function useFetch(fetcher, deps = []) {
  const fetcherRef = useRef(fetcher)
  const [tick, setTick] = useState(0)
  const [result, setResult] = useState({ key: null, data: null, error: '' })
  const key = `${JSON.stringify(deps)}#${tick}`

  useEffect(() => {
    fetcherRef.current = fetcher
  })

  useEffect(() => {
    let active = true
    Promise.resolve()
      .then(() => fetcherRef.current())
      .then((data) => {
        if (active) setResult({ key, data, error: '' })
      })
      .catch((err) => {
        if (active) setResult((current) => ({ key, data: current.data, error: err.response?.data?.message || 'Something went wrong' }))
      })
    return () => { active = false }
  }, [key])

  const reload = useCallback(() => setTick((value) => value + 1), [])
  const loading = result.key !== key

  return { data: result.data, loading, error: loading ? '' : result.error, reload }
}