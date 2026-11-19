import './ui.css'

export default function BarChart({ items, format = (v) => v }) {
  const max = Math.max(...items.map((i) => i.value), 1)
  return (
    <div className="ui-bars">
      {items.map((i) => (
        <div className="ui-bar" key={i.label}>
          <span className="ui-bar__val">{format(i.value)}</span>
          <div className="ui-bar__fill" style={{ height: `${(i.value / max) * 70}%` }} />
          <span className="ui-bar__label">{i.label}</span>
        </div>
      ))}
    </div>
  )
}