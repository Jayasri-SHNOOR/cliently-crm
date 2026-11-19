import './ui.css'

export default function Panel({ title, subtitle, action, children }) {
  return (
    <section className="ui-panel">
      {(title || action) && (
        <div className="ui-panel__head">
          <div>
            <h2>{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  )
}