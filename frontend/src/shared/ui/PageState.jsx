import './ui.css'

export default function PageState({ loading, error, onRetry }) {
  if (loading) return <main className="ui-page"><p className="ui-empty">Loading...</p></main>
  if (error) {
    return (
      <main className="ui-page">
        <p className="ui-empty">{error}</p>
        {onRetry && <div><button className="ui-btn" onClick={onRetry}>Retry</button></div>}
      </main>
    )
  }
  return null
}