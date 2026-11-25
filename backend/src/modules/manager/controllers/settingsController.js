
const User = require('../../../models/User')
const ManagerSettings = require('../../../models/ManagerSettings')
const AppError = require('../../../utils/AppError')

const PROFILE_FIELDS = [
  'firstName',
  'middleName',
  'lastName',
  'countryCode',
  'phone',
  'dateOfBirth',
  'emergencyName',
  'emergencyRelationship',
  'emergencyPhone',
  'address',
  'city',
  'state',
  'postalCode'
]

const NOTIFICATION_FIELDS = [
  'email',
  'tasks',
  'meetings',
  'announcements'
]

function hasOwn(object, key) {
  return Object.prototype.hasOwnProperty.call(object, key)
}

function cleanString(value, field) {
  if (typeof value !== 'string') {
    throw new AppError(`${field} must be a string.`, 400)
  }

  return value.trim()
}

function getNameParts(name = '') {
  const parts = String(name).trim().split(/\s+/).filter(Boolean)

  return {
    firstName: parts[0] || '',
    middleName: parts.length > 2 ? parts.slice(1, -1).join(' ') : '',
    lastName: parts.length > 1 ? parts[parts.length - 1] : ''
  }
}

function plainProfile(settings) {
  return settings.profile?.toObject
    ? settings.profile.toObject()
    : { ...(settings.profile || {}) }
}

async function getContext(req) {
  const userId = req.user?.id
  const tenantId = req.user?.tenantId

  if (!userId || !tenantId) {
    throw new AppError(
      'Authenticated user or company information is missing.',
      401
    )
  }

  const user = await User.findOne({
    _id: userId,
    tenantId
  })

  if (!user) {
    throw new AppError('User account not found.', 404)
  }

  const settings = await ManagerSettings.findOneAndUpdate(
    { userId: user._id, tenantId },
    {
      $setOnInsert: {
        userId: user._id,
        tenantId
      }
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
      runValidators: true
    }
  )

  return { user, settings }
}

function buildProfile(user, settings) {
  const saved = plainProfile(settings)
  const nameParts = getNameParts(user.name)

  return {
    ...saved,
    firstName: saved.firstName || nameParts.firstName,
    middleName: saved.middleName || nameParts.middleName,
    lastName: saved.lastName || nameParts.lastName,
    email: user.email,
    role: user.role,
    employeeId: user.employeeId || null
  }
}

async function getProfile(req, res, next) {
  try {
    const { user, settings } = await getContext(req)

    res.json({
      success: true,
      profile: buildProfile(user, settings)
    })
  } catch (error) {
    next(error)
  }
}

async function updateProfile(req, res, next) {
  try {
    const { user, settings } = await getContext(req)
    const body = req.body || {}
    const updates = {}

    for (const field of PROFILE_FIELDS) {
      if (!hasOwn(body, field)) continue

      if (field === 'dateOfBirth') {
        if (body[field] === '' || body[field] === null) {
          updates[`profile.${field}`] = null
        } else {
          const date = new Date(body[field])

          if (Number.isNaN(date.getTime())) {
            throw new AppError('Please provide a valid date of birth.', 400)
          }

          if (date.getTime() > Date.now()) {
            throw new AppError('Date of birth cannot be in the future.', 400)
          }

          updates[`profile.${field}`] = date
        }
      } else {
        updates[`profile.${field}`] = cleanString(body[field], field)
      }
    }

    if (Object.keys(updates).length === 0) {
      throw new AppError('No editable profile fields were provided.', 400)
    }

    const settingsDoc = await ManagerSettings.findOneAndUpdate(
      { userId: user._id, tenantId: user.tenantId },
      { $set: updates },
      { new: true, runValidators: true }
    )

    const nameWasSubmitted =
      hasOwn(body, 'firstName') ||
      hasOwn(body, 'middleName') ||
      hasOwn(body, 'lastName')

    if (nameWasSubmitted) {
      const saved = plainProfile(settingsDoc)
      const oldParts = getNameParts(user.name)

      const firstName = hasOwn(body, 'firstName')
        ? cleanString(body.firstName, 'firstName')
        : saved.firstName || oldParts.firstName

      const middleName = hasOwn(body, 'middleName')
        ? cleanString(body.middleName, 'middleName')
        : saved.middleName || oldParts.middleName

      const lastName = hasOwn(body, 'lastName')
        ? cleanString(body.lastName, 'lastName')
        : saved.lastName || oldParts.lastName

      if (!firstName || !lastName) {
        throw new AppError('First name and last name are required.', 400)
      }

      const fullName = [firstName, middleName, lastName]
        .filter(Boolean)
        .join(' ')

      user.name = fullName
      await user.save()
    }

    res.json({
      success: true,
      message: 'Profile updated successfully.',
      profile: buildProfile(user, settingsDoc)
    })
  } catch (error) {
    next(error)
  }
}

async function getNotifications(req, res, next) {
  try {
    const { settings } = await getContext(req)

    res.json({
      success: true,
      notifications: settings.notifications
    })
  } catch (error) {
    next(error)
  }
}

async function updateNotifications(req, res, next) {
  try {
    const { user } = await getContext(req)
    const body = req.body || {}
    const updates = {}

    for (const field of NOTIFICATION_FIELDS) {
      if (!hasOwn(body, field)) continue

      if (typeof body[field] !== 'boolean') {
        throw new AppError(`${field} must be true or false.`, 400)
      }

      updates[`notifications.${field}`] = body[field]
    }

    if (Object.keys(updates).length === 0) {
      throw new AppError(
        'No notification preferences were provided.',
        400
      )
    }

    const settings = await ManagerSettings.findOneAndUpdate(
      { userId: user._id, tenantId: user.tenantId },
      { $set: updates },
      { new: true, runValidators: true }
    )

    res.json({
      success: true,
      message: 'Notification preferences updated successfully.',
      notifications: settings.notifications
    })
  } catch (error) {
    next(error)
  }
}

module.exports = {
  getProfile,
  updateProfile,
  getNotifications,
  updateNotifications
}
