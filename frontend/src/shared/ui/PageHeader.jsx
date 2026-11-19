import './ui.css'

export default function PageHeader({ title, subtitle, actions }) {
  return (
    <header className="ui-header">
      <div>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {actions && <div className="ui-actions">{actions}</div>}
    </header>
  )
}