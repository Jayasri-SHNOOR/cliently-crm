const [method = 'GET', url, countText = '12', token = 'fake-token'] = process.argv.slice(2)

async function main() {
  if (!url) {
    console.log('Usage: node src/tests/fireRequests.js METHOD URL COUNT [TOKEN]')
    return
  }

  const count = Number(countText)

  for (let i = 1; i <= count; i += 1) {
    const res = await fetch(url, {
      method,
      headers: { Authorization: `Bearer ${token}` }
    })
    const body = await res.json().catch(() => ({}))
    const remaining = res.headers.get('ratelimit-remaining') ?? '-'
    const retry = res.headers.get('retry-after')
    const retryText = retry ? `  retry-after=${retry}s` : ''
    console.log(`#${String(i).padStart(2)}  ${res.status}  remaining=${remaining}${retryText}  ${body.message || ''}`)
  }
}

main().catch((err) => console.error('Failed:', err.message))