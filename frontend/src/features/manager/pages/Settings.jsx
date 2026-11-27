
import { useState, useEffect } from 'react'
import { UserRound, Camera, Trash2, LockKeyhole } from 'lucide-react'
import PageHeader from '../../../shared/ui/PageHeader'
import { updateCurrentUser } from '../../../lib/session'
import { apiFetch } from '../../../lib/api'
import { useCurrentUser } from '../../../lib/useSession'
import '../../../shared/ui/ui.css'


const initialForm = {
  firstName: '',
  middleName: '',
  lastName: '',
  email: '',
  countryCode: '+91',
  phone: '',
  dateOfBirth: '',
  employeeId: '',
  designation: '',
  department: '',
  joiningDate: '',
  employmentType: 'Full-time',
  emergencyName: '',
  emergencyRelationship: '',
  emergencyPhone: '',
  address: '',
  city: '',
  state: '',
  postalCode: '',
}

const initialNotifications = {
  email: true,
  tasks: true,
  meetings: true,
  announcements: false,
}

function normalizeRole(value) {
  return String(value || '')
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, '_')
}

async function apiRequest(path, options = {}) {
  return apiFetch(`/api${path}`, {
    method: options.method || 'GET',
    body: options.body ? JSON.parse(options.body) : undefined,
  })
}

const cardStyle = {
  background: 'var(--white, #fff)',
  border: '1px solid var(--border-color, #e5e7eb)',
  borderRadius: 'var(--radius-card, 10px)',
  padding: '24px',
  width: '100%',
  boxSizing: 'border-box',
}

const titleStyle = {
  margin: '0 0 6px',
  fontSize: '18px',
  fontWeight: 600,
  color: 'var(--text-color, #1f2937)',
}

const descriptionStyle = {
  margin: 0,
  fontSize: '13px',
  color: 'var(--muted-text, #6b7280)',
  lineHeight: 1.6,
}

const gridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: '22px 28px',
  width: '100%',
}

const fieldStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  minWidth: 0,
}

const labelStyle = {
  fontSize: '13px',
  fontWeight: 500,
  color: 'var(--muted-text, #52616b)',
}

const inputStyle = {
  width: '100%',
  minWidth: 0,
  height: '44px',
  boxSizing: 'border-box',
  padding: '0 14px',
  border: '1px solid var(--border-color, #d5e0df)',
  borderRadius: '12px',
  background: 'var(--white, #fff)',
  color: 'var(--text-color, #374151)',
  fontSize: '14px',
  outline: 'none',
}

const buttonRowStyle = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '12px',
  flexWrap: 'wrap',
  marginTop: '4px',
}

const requiredStyle = {
  color: '#dc2626',
  marginLeft: '3px',
}

function Required() {
  return <span style={requiredStyle}>*</span>
}

export default function Settings({ role: roleProp }) {
  const [form, setForm] = useState(initialForm)
  const [notifications, setNotifications] = useState(initialNotifications)
  const [profilePhoto, setProfilePhoto] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const currentUser = useCurrentUser()
  const role = normalizeRole(roleProp || currentUser?.role)

  const isClientAdmin = [
    'CLIENT_ADMIN',
    'CLIENTADMIN',
    'TENANT_ADMIN',
  ].includes(role)

  useEffect(() => {
    let active = true

    async function loadSettings() {
      setLoading(true)

      try {
        const [profileResult, notificationResult] = await Promise.all([
          apiRequest('/manager/settings/profile'),
          apiRequest('/manager/settings/notifications'),
        ])

        if (!active) return

        const profile =
          profileResult.profile ||
          profileResult.data?.profile ||
          profileResult.data ||
          {}

        const notificationData =
          notificationResult.notifications ||
          notificationResult.data?.notifications ||
          notificationResult.data ||
          {}

        setForm(previous => ({
          ...previous,
          ...profile,
          dateOfBirth: profile.dateOfBirth
            ? String(profile.dateOfBirth).slice(0, 10)
            : '',
          joiningDate: profile.joiningDate
            ? String(profile.joiningDate).slice(0, 10)
            : '',
          email: profile.email || profileResult.email || '',
        }))

        setNotifications(previous => ({
          ...previous,
          ...notificationData,
        }))
      } catch (error) {
        if (active) {
          setMessage(`Could not load saved settings: ${error.message}`)
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    loadSettings()

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    return () => {
      if (profilePhoto.startsWith('blob:')) {
        URL.revokeObjectURL(profilePhoto)
      }
    }
  }, [profilePhoto])

  const update = event => {
    const { name, value } = event.target

    setForm(previous => ({
      ...previous,
      [name]: value,
    }))

    setMessage('')
  }

  const updateNotification = event => {
    const { name, checked } = event.target

    setNotifications(previous => ({
      ...previous,
      [name]: checked,
    }))

    setMessage('')
  }

  const uploadPhoto = event => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setMessage('Please select an image file.')
      event.target.value = ''
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage('Image size must be less than 5 MB.')
      event.target.value = ''
      return
    }

    setProfilePhoto(URL.createObjectURL(file))
    setMessage(
      'Photo preview updated. Photo upload needs a backend upload endpoint.'
    )
    event.target.value = ''
  }

  const removePhoto = () => {
    setProfilePhoto('')
    setMessage(
      'Photo preview removed. Save photo removal after a backend photo endpoint is connected.'
    )
  }

  const field = (
    label,
    name,
    placeholder = '',
    type = 'text',
    required = false,
    disabled = false
  ) => (
    <div style={fieldStyle} key={name}>
      <label htmlFor={name} style={labelStyle}>
        {label}
        {required && <Required />}
      </label>

      <input
        id={name}
        name={name}
        type={type}
        value={form[name] ?? ''}
        onChange={update}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        style={{
          ...inputStyle,
          ...(disabled
            ? {
                background: 'var(--page-background, #f3f4f6)',
                cursor: 'not-allowed',
                opacity: 0.8,
              }
            : {}),
        }}
      />
    </div>
  )

  const selectField = (label, name, options, disabled = false) => (
    <div style={fieldStyle} key={name}>
      <label htmlFor={name} style={labelStyle}>
        {label}
      </label>

      <select
        id={name}
        name={name}
        value={form[name]}
        onChange={update}
        disabled={disabled}
        style={inputStyle}
      >
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )

  const phoneField = (label, name, required = false) => (
    <div style={fieldStyle} key={name}>
      <label htmlFor={name} style={labelStyle}>
        {label}
        {required && <Required />}
      </label>

      <div style={{ display: 'flex', gap: '10px', minWidth: 0 }}>
        <select
          aria-label="Country calling code"
          name="countryCode"
          value={form.countryCode}
          onChange={update}
          style={{ ...inputStyle, width: '105px', flexShrink: 0 }}
        >
          {['+91', '+1', '+44', '+61', '+971'].map(code => (
            <option key={code} value={code}>
              {code}
            </option>
          ))}
        </select>

        <input
          id={name}
          name={name}
          type="tel"
          value={form[name] || ''}
          onChange={update}
          placeholder="Enter phone number"
          required={required}
          style={inputStyle}
        />
      </div>
    </div>
  )

  const section = (title, description, children, id) => (
    <section key={id} id={id} style={cardStyle}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={titleStyle}>{title}</h2>
        <p style={descriptionStyle}>{description}</p>
      </div>

      {children}
    </section>
  )

  const saveSettings = async event => {
    event.preventDefault()

    if (saving) return

    const fullName = [
      form.firstName,
      form.middleName,
      form.lastName,
    ]
      .filter(Boolean)
      .join(' ')
      .trim()

    if (!form.firstName.trim() || !form.lastName.trim()) {
      setMessage('First name and last name are required.')
      return
    }

    setSaving(true)
    setMessage('')

    try {
      const profilePayload = {
        firstName: form.firstName,
        middleName: form.middleName,
        lastName: form.lastName,
        countryCode: form.countryCode,
        phone: form.phone,
        dateOfBirth: form.dateOfBirth || null,
        emergencyName: form.emergencyName,
        emergencyRelationship: form.emergencyRelationship,
        emergencyPhone: form.emergencyPhone,
        address: form.address,
        city: form.city,
        state: form.state,
        postalCode: form.postalCode,
      }

      await Promise.all([
        apiRequest('/manager/settings/profile', {
          method: 'PATCH',
          body: JSON.stringify(profilePayload),
        }),

        apiRequest('/manager/settings/notifications', {
          method: 'PATCH',
          body: JSON.stringify(notifications),
        }),
      ])

      updateCurrentUser({ name: fullName })

      setMessage('Settings saved successfully.')
    } catch (error) {
      setMessage(`Could not save settings: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  const resetSettings = () => {
    setForm(initialForm)
    setNotifications(initialNotifications)
    setProfilePhoto('')
    setMessage(
      'Form reset. Click Save Changes to save the default values.'
    )
  }

  return (
    <div
      className="ui-page"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      <PageHeader
        title="Settings"
        subtitle="Manage your profile and account preferences."
      />

      {loading && (
        <p style={descriptionStyle}>Loading saved settings...</p>
      )}

      <form
        onSubmit={saveSettings}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '22px',
          width: '100%',
          minWidth: 0,
        }}
      >
        {section(
          'Profile Photo',
          'Update your profile picture.',
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '24px',
              flexWrap: 'wrap',
            }}
          >
            <div
              style={{
                width: '110px',
                height: '110px',
                flexShrink: 0,
                borderRadius: '50%',
                overflow: 'hidden',
                border: '1px solid var(--border-color, #e5e7eb)',
                background: 'var(--white, #fff)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--muted-text, #6b7280)',
              }}
            >
              {profilePhoto ? (
                <img
                  src={profilePhoto}
                  alt="Profile preview"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
              ) : (
                <UserRound size={46} strokeWidth={1.5} />
              )}
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: '12px',
              }}
            >
              <label
                htmlFor="profilePhotoUpload"
                className="ui-btn"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                }}
              >
                <Camera size={16} />
                Upload Photo
              </label>

              <input
                id="profilePhotoUpload"
                type="file"
                accept="image/*"
                onChange={uploadPhoto}
                style={{ display: 'none' }}
              />

              <p style={descriptionStyle}>
                JPG or PNG. Maximum file size: 5 MB.
              </p>

              {profilePhoto && (
                <button
                  type="button"
                  className="ui-btn"
                  onClick={removePhoto}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <Trash2 size={15} />
                  Remove Photo
                </button>
              )}
            </div>
          </div>,
          'profile-photo'
        )}

        {section(
          'Personal Information',
          'Update your basic personal and contact details.',
          <div style={gridStyle} className="settings-fields-grid">
            {field('First Name', 'firstName', 'Enter first name', 'text', true)}
            {field('Middle Name', 'middleName', 'Enter middle name')}
            {field('Last Name', 'lastName', 'Enter last name', 'text', true)}
            {field('Email Address', 'email', 'name@company.com', 'email', true, true)}
            {phoneField('Phone Number', 'phone', true)}
            {field('Date of Birth', 'dateOfBirth', '', 'date')}
          </div>,
          'personal-information'
        )}

        {section(
          'Employment Information',
          isClientAdmin
            ? 'Client Admin can manage employee employment details.'
            : 'Employment Information is managed by Client Admin.',
          <>
            {!isClientAdmin && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 14px',
                  marginBottom: '20px',
                  borderRadius: '8px',
                  background: 'var(--page-background, #f3f4f6)',
                  color: 'var(--muted-text, #6b7280)',
                  fontSize: '13px',
                }}
              >
                <LockKeyhole size={16} />
                Only Client Admin can edit these fields.
              </div>
            )}

            <div style={gridStyle} className="settings-fields-grid">
              {field('Employee ID', 'employeeId', 'Enter employee ID', 'text', false, !isClientAdmin)}
              {field('Designation', 'designation', 'Enter designation', 'text', false, !isClientAdmin)}
              {field('Department', 'department', 'Enter department', 'text', false, !isClientAdmin)}

              {selectField(
                'Employment Type',
                'employmentType',
                [
                  { value: 'Full-time', label: 'Full-time' },
                  { value: 'Part-time', label: 'Part-time' },
                  { value: 'Contract', label: 'Contract' },
                  { value: 'Intern', label: 'Intern' },
                ],
                !isClientAdmin
              )}

              {field('Date of Joining', 'joiningDate', '', 'date', false, !isClientAdmin)}
            </div>
          </>,
          'employment-information'
        )}

        {section(
          'Emergency Contact',
          'Add someone to contact in case of an emergency.',
          <div style={gridStyle} className="settings-fields-grid">
            {field('Contact Name', 'emergencyName', 'Enter contact name')}
            {field('Relationship', 'emergencyRelationship', 'e.g. Parent, Spouse, Sibling')}
            {phoneField('Emergency Phone Number', 'emergencyPhone')}
          </div>,
          'emergency-contact'
        )}

        {section(
          'Personal Details',
          'Manage your address and location information.',
          <div style={gridStyle} className="settings-fields-grid">
            {field('Address', 'address', 'Enter street address')}
            {field('City', 'city', 'Enter city')}
            {field('State', 'state', 'Enter state')}
            {field('Postal Code', 'postalCode', 'Enter postal code')}
          </div>,
          'personal-details'
        )}

        {section(
          'Account & Security',
          'Your sign-in email and password.',
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 14px',
              borderRadius: '8px',
              background: 'var(--page-background, #f3f4f6)',
              color: 'var(--muted-text, #6b7280)',
              fontSize: '13px',
            }}
          >
            <LockKeyhole size={16} />
            You sign in with {form.email || 'your work email'}. To change your email or reset your password, contact your Client Admin.
          </div>,
          'account-security'
        )}

        {section(
          'Notification Preferences',
          'Choose which notifications you want to receive.',
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '22px',
            }}
          >
            {[
              {
                name: 'email',
                title: 'Email Notifications',
                description: 'Receive important updates through email.',
              },
              {
                name: 'tasks',
                title: 'Task Reminders',
                description: 'Get reminders about assigned tasks and deadlines.',
              },
              {
                name: 'meetings',
                title: 'Meeting Notifications',
                description: 'Receive updates about upcoming meetings.',
              },
              {
                name: 'announcements',
                title: 'Announcements',
                description: 'Receive company announcements and general updates.',
              },
            ].map(item => (
              <label
                key={item.name}
                htmlFor={`notification-${item.name}`}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  cursor: 'pointer',
                }}
              >
                <input
                  id={`notification-${item.name}`}
                  type="checkbox"
                  name={item.name}
                  checked={Boolean(notifications[item.name])}
                  onChange={updateNotification}
                  style={{
                    width: '16px',
                    height: '16px',
                    marginTop: '3px',
                    accentColor: 'var(--text-color, #374151)',
                    cursor: 'pointer',
                    flexShrink: 0,
                  }}
                />

                <span
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '5px',
                  }}
                >
                  <span
                    style={{
                      fontSize: '14px',
                      fontWeight: 500,
                      color: 'var(--text-color, #374151)',
                    }}
                  >
                    {item.title}
                  </span>

                  <span style={descriptionStyle}>
                    {item.description}
                  </span>
                </span>
              </label>
            ))}
          </div>,
          'notification-preferences'
        )}

        {message && (
          <p
            role="status"
            style={{
              margin: 0,
              fontSize: '13px',
              color:
                message.toLowerCase().includes('could not')
                  ? '#dc2626'
                  : 'var(--text-color, #374151)',
            }}
          >
            {message}
          </p>
        )}

        <div style={buttonRowStyle}>
          <button
            type="button"
            className="ui-btn"
            onClick={resetSettings}
            disabled={saving}
          >
            Reset
          </button>

          <button
            type="submit"
            className="ui-btn"
            disabled={saving || loading}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>

      <style>{`
        @media (max-width: 650px) {
          .settings-fields-grid {
            grid-template-columns: minmax(0, 1fr) !important;
          }
        }
      `}</style>
    </div>
  )
}
