import { useState, useEffect } from 'react'
import { UserRound, Camera, Trash2, LockKeyhole } from 'lucide-react'
import PageHeader from '../ui/PageHeader'
import '../ui/ui.css'
import { getMySettings, saveMySettings, changePassword } from './settingsApi'


const EMPLOYMENT_FIELDS = [
  'employeeId',
  'designation',
  'department',
  'joiningDate',
  'employmentType',
]

const initialForm = {
  firstName: '', middleName: '', lastName: '', email: '',
  countryCode: '+91', phone: '', dateOfBirth: '',
  employeeId: '', designation: '', department: '', joiningDate: '',
  employmentType: 'Full-time',
  emergencyName: '', emergencyRelationship: '', emergencyPhone: '',
  address: '', city: '', state: '', postalCode: '',
  currentPassword: '', newPassword: '', confirmPassword: '',
}

const initialNotifications = {
  email: true, tasks: true, meetings: true, announcements: false,
}

const NOTIFICATION_ITEMS = [
  { name: 'email', title: 'Email Notifications', description: 'Receive important updates through email.' },
  { name: 'tasks', title: 'Task Reminders', description: 'Get reminders about assigned tasks and deadlines.' },
  { name: 'meetings', title: 'Meeting Notifications', description: 'Receive updates about upcoming meetings.' },
  { name: 'announcements', title: 'Announcements', description: 'Receive company announcements and general updates.' },
]

const EMPLOYMENT_TYPES = ['Full-time', 'Part-time', 'Contract', 'Intern'].map((v) => ({ value: v, label: v }))


function normalizeRole(value) {
  return String(value || '').trim().toUpperCase().replace(/[\s-]+/g, '_')
}

function getStoredRole() {
  if (typeof window === 'undefined') return ''
  for (const key of ['role', 'userRole', 'currentRole']) {
    const v = localStorage.getItem(key)
    if (v) return normalizeRole(v)
  }
  for (const key of ['user', 'currentUser', 'authUser']) {
    try {
      const raw = localStorage.getItem(key)
      if (!raw) continue
      const u = JSON.parse(raw)
      const role = u?.role || u?.user?.role || u?.data?.role || u?.userRole
      if (role) return normalizeRole(role)
    } catch { /* ignore */ }
  }
  return ''
}


const cardStyle = {
  background: 'var(--white, #fff)',
  border: '1px solid var(--border-color, #e5e7eb)',
  borderRadius: 'var(--radius-card, 10px)',
  padding: 24, width: '100%', boxSizing: 'border-box',
}
const titleStyle = { margin: '0 0 6px', fontSize: 18, fontWeight: 600, color: 'var(--text-color, #1f2937)' }
const descriptionStyle = { margin: 0, fontSize: 13, color: 'var(--muted-text, #6b7280)', lineHeight: 1.6 }
const gridStyle = { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '22px 28px', width: '100%' }
const fieldStyle = { display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0 }
const labelStyle = { fontSize: 13, fontWeight: 500, color: 'var(--muted-text, #52616b)' }
const inputStyle = {
  width: '100%', minWidth: 0, height: 44, boxSizing: 'border-box', padding: '0 14px',
  border: '1px solid var(--border-color, #d5e0df)', borderRadius: 12,
  background: 'var(--white, #fff)', color: 'var(--text-color, #374151)', fontSize: 14, outline: 'none',
}
const disabledStyle = { background: 'var(--page-background, #f3f4f6)', cursor: 'not-allowed', opacity: 0.8 }
const buttonRowStyle = { display: 'flex', justifyContent: 'flex-end', gap: 12, flexWrap: 'wrap', marginTop: 4 }

const Required = () => <span style={{ color: '#dc2626', marginLeft: 3 }}>*</span>

export default function Settings({ role: roleProp }) {
  const [form, setForm] = useState(initialForm)
  const [notifications, setNotifications] = useState(initialNotifications)
  const [profilePhoto, setProfilePhoto] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const role = normalizeRole(roleProp || getStoredRole())
  const isClientAdmin = ['CLIENT_ADMIN', 'CLIENTADMIN', 'TENANT_ADMIN'].includes(role)

  useEffect(() => {
    let alive = true
    getMySettings()
      .then((data) => {
        if (!alive || !data) return
        setForm((p) => ({ ...p, ...data.profile }))
        if (data.notifications) setNotifications((p) => ({ ...p, ...data.notifications }))
        if (data.photoUrl) setProfilePhoto(data.photoUrl)
      })
      .catch(() => alive && setMessage('Could not load your settings.'))
      .finally(() => alive && setLoading(false))
    return () => { alive = false }
  }, [])

  useEffect(() => () => {
    if (profilePhoto?.startsWith('blob:')) URL.revokeObjectURL(profilePhoto)
  }, [profilePhoto])

  const update = (e) => {
    const { name, value } = e.target
    setForm((p) => ({ ...p, [name]: value }))
    setMessage('')
  }

  const updateNotification = (e) => {
    const { name, checked } = e.target
    setNotifications((p) => ({ ...p, [name]: checked }))
    setMessage('')
  }

  const uploadPhoto = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { setMessage('Please select an image file.'); e.target.value = ''; return }
    if (file.size > 5 * 1024 * 1024) { setMessage('Image size must be less than 5 MB.'); e.target.value = ''; return }
    setProfilePhoto(URL.createObjectURL(file))
    setMessage('')
    e.target.value = ''
  }

  const field = (label, name, placeholder = '', type = 'text', required = false, disabled = false) => (
    <div style={fieldStyle} key={name}>
      <label htmlFor={name} style={labelStyle}>{label}{required && <Required />}</label>
      <input
        id={name} name={name} type={type} value={form[name] ?? ''} onChange={update}
        placeholder={placeholder} required={required} disabled={disabled}
        style={{ ...inputStyle, ...(disabled ? disabledStyle : {}) }}
      />
    </div>
  )

  const selectField = (label, name, options, disabled = false) => (
    <div style={fieldStyle} key={name}>
      <label htmlFor={name} style={labelStyle}>{label}</label>
      <select
        id={name} name={name} value={form[name]} onChange={update} disabled={disabled}
        style={{ ...inputStyle, ...(disabled ? disabledStyle : {}) }}
      >
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )

  const phoneField = (label, name, required = false) => (
    <div style={fieldStyle} key={name}>
      <label htmlFor={name} style={labelStyle}>{label}{required && <Required />}</label>
      <div style={{ display: 'flex', gap: 10, minWidth: 0 }}>
        <select
          aria-label="Country calling code" name="countryCode" value={form.countryCode}
          onChange={update} style={{ ...inputStyle, width: 105, flexShrink: 0 }}
        >
          {['+91', '+1', '+44', '+61', '+971'].map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <input
          id={name} name={name} type="tel" value={form[name] ?? ''} onChange={update}
          placeholder="Enter phone number" required={required} style={inputStyle}
        />
      </div>
    </div>
  )

  const section = (title, description, children, id) => (
    <section key={id} id={id} style={cardStyle}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={titleStyle}>{title}</h2>
        <p style={descriptionStyle}>{description}</p>
      </div>
      {children}
    </section>
  )

  const saveSettings = async (e) => {
    e.preventDefault()

    if (form.newPassword && form.newPassword !== form.confirmPassword) {
      setMessage('New password and confirm password do not match.')
      return
    }
    const {
      currentPassword, newPassword, confirmPassword, email, ...profile
    } = form
    if (!isClientAdmin) EMPLOYMENT_FIELDS.forEach((k) => delete profile[k])

    setSaving(true)
    try {
      await saveMySettings({ profile, notifications })
      if (newPassword) {
        await changePassword(currentPassword, newPassword)
        setForm((p) => ({ ...p, currentPassword: '', newPassword: '', confirmPassword: '' }))
      }
      setMessage('Settings saved successfully.')
    } catch (err) {
      setMessage(err?.message || 'Failed to save settings.')
    } finally {
      setSaving(false)
    }
  }

  const resetSettings = () => {
    setLoading(true)
    getMySettings()
      .then((data) => {
        setForm({ ...initialForm, ...data?.profile })
        setNotifications({ ...initialNotifications, ...data?.notifications })
        setProfilePhoto(data?.photoUrl || '')
        setMessage('')
      })
      .finally(() => setLoading(false))
  }

  if (loading) return <div className="ui-page"><p style={descriptionStyle}>Loading settings…</p></div>

  return (
    <div className="ui-page" style={{ display: 'flex', flexDirection: 'column', gap: 24, width: '100%', boxSizing: 'border-box' }}>
      <PageHeader title="Settings" subtitle="Manage your profile and account preferences." />

      <form onSubmit={saveSettings} style={{ display: 'flex', flexDirection: 'column', gap: 22, width: '100%', minWidth: 0 }}>
        {section('Profile Photo', 'Update your profile picture.',
          <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
            <div style={{
              width: 110, height: 110, flexShrink: 0, borderRadius: '50%', overflow: 'hidden',
              border: '1px solid var(--border-color, #e5e7eb)', display: 'flex',
              alignItems: 'center', justifyContent: 'center', color: 'var(--muted-text, #6b7280)',
            }}>
              {profilePhoto
                ? <img src={profilePhoto} alt="Profile preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <UserRound size={46} strokeWidth={1.5} />}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 12 }}>
              <label htmlFor="profilePhotoUpload" className="ui-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <Camera size={16} /> Upload Photo
              </label>
              <input id="profilePhotoUpload" type="file" accept="image/*" onChange={uploadPhoto} style={{ display: 'none' }} />
              <p style={descriptionStyle}>JPG or PNG. Maximum file size: 5 MB.</p>
              {profilePhoto && (
                <button type="button" className="ui-btn" onClick={() => { setProfilePhoto(''); setMessage('') }}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <Trash2 size={15} /> Remove Photo
                </button>
              )}
            </div>
          </div>,
          'profile-photo')}

        {section('Personal Information', 'Update your basic personal and contact details.',
          <div style={gridStyle} className="settings-fields-grid">
            {field('First Name', 'firstName', 'Enter first name', 'text', true)}
            {field('Middle Name', 'middleName', 'Enter middle name')}
            {field('Last Name', 'lastName', 'Enter last name', 'text', true)}
            {field('Email Address', 'email', 'name@company.com', 'email', true, true)}
            {phoneField('Phone Number', 'phone', true)}
            {field('Date of Birth', 'dateOfBirth', '', 'date')}
          </div>,
          'personal-information')}

        {section('Employment Information',
          isClientAdmin
            ? 'Details assigned to you as Client Admin. Employees\u2019 details are managed from the Employees page.'
            : 'Assigned by your Client Admin.',
          <>
            {!isClientAdmin && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '12px 14px', marginBottom: 20,
                borderRadius: 8, background: 'var(--page-background, #f3f4f6)',
                color: 'var(--muted-text, #6b7280)', fontSize: 13,
              }}>
                <LockKeyhole size={16} /> Only Client Admin can edit these fields.
              </div>
            )}
            <div style={gridStyle} className="settings-fields-grid">
              {field('Employee ID', 'employeeId', 'Enter employee ID', 'text', false, !isClientAdmin)}
              {field('Designation', 'designation', 'Enter designation', 'text', false, !isClientAdmin)}
              {field('Department', 'department', 'Enter department', 'text', false, !isClientAdmin)}
              {selectField('Employment Type', 'employmentType', EMPLOYMENT_TYPES, !isClientAdmin)}
              {field('Date of Joining', 'joiningDate', '', 'date', false, !isClientAdmin)}
            </div>
          </>,
          'employment-information')}

        {section('Emergency Contact', 'Add someone to contact in case of an emergency.',
          <div style={gridStyle} className="settings-fields-grid">
            {field('Contact Name', 'emergencyName', 'Enter contact name')}
            {field('Relationship', 'emergencyRelationship', 'e.g. Parent, Spouse, Sibling')}
            {phoneField('Emergency Phone Number', 'emergencyPhone')}
          </div>,
          'emergency-contact')}

        {section('Personal Details', 'Manage your address and location information.',
          <div style={gridStyle} className="settings-fields-grid">
            {field('Address', 'address', 'Enter street address')}
            {field('City', 'city', 'Enter city')}
            {field('State', 'state', 'Enter state')}
            {field('Postal Code', 'postalCode', 'Enter postal code')}
          </div>,
          'personal-details')}

        {section('Account & Security', 'Change your password.',
          <div style={gridStyle} className="settings-fields-grid">
            {field('Current Password', 'currentPassword', 'Enter current password', 'password')}
            {field('New Password', 'newPassword', 'Enter new password', 'password')}
            {field('Confirm New Password', 'confirmPassword', 'Confirm new password', 'password')}
          </div>,
          'account-security')}

        {section('Notification Preferences', 'Choose which notifications you want to receive.',
          <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
            {NOTIFICATION_ITEMS.map((item) => (
              <label key={item.name} htmlFor={`notification-${item.name}`}
                style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer' }}>
                <input
                  id={`notification-${item.name}`} type="checkbox" name={item.name}
                  checked={!!notifications[item.name]} onChange={updateNotification}
                  style={{ width: 16, height: 16, marginTop: 3, accentColor: 'var(--text-color, #374151)', cursor: 'pointer', flexShrink: 0 }}
                />
                <span style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-color, #374151)' }}>{item.title}</span>
                  <span style={descriptionStyle}>{item.description}</span>
                </span>
              </label>
            ))}
          </div>,
          'notification-preferences')}

        {message && <p role="status" style={{ margin: 0, fontSize: 13, color: 'var(--text-color, #374151)' }}>{message}</p>}

        <div style={buttonRowStyle}>
          <button type="button" className="ui-btn" onClick={resetSettings}>Reset</button>
          <button type="submit" className="ui-btn" disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</button>
        </div>
      </form>

      <style>{`
        @media (max-width: 650px) {
          .settings-fields-grid { grid-template-columns: minmax(0, 1fr) !important; }
        }
      `}</style>
    </div>
  )
}