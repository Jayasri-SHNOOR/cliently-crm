import './layout.css'

export default function AppShell({ sidebar, topbar, children }) {
  return (
    <div className="ly-shell">
      {sidebar}
      <div className="ly-main">
        {topbar}
        {children}
      </div>
    </div>
  )
}