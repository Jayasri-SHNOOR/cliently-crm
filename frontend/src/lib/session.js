
let accessToken = null
let currentUser = null

const listeners = new Set()

function notify() {
  listeners.forEach((listener) => listener(currentUser))
}

export function getAccessToken() {
  return accessToken
}

export function getCurrentUser() {
  return currentUser
}

export function setSession({ accessToken: token, user }) {
  accessToken = token || null

  if (user) {
    currentUser = user
  }

  notify()
}

export function updateCurrentUser(updates) {
  if (!currentUser || !updates || typeof updates !== 'object') {
    return
  }

  currentUser = {
    ...currentUser,
    ...updates,
  }

  notify()
}

export function clearSession() {
  accessToken = null
  currentUser = null

  notify()
}

export function subscribe(listener) {
  listeners.add(listener)

  return () => {
    listeners.delete(listener)
  }
}
