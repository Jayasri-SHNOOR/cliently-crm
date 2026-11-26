const MINUTE = 60 * 1000
function envNumber(name, fallback) {
  const value = Number(process.env[name])
  return Number.isFinite(value) && value > 0 ? value : fallback
}

const sessionConfig = {
  accessTokenSecret: process.env.JWT_ACCESS_SECRET,
  accessTokenTtlSeconds: envNumber('ACCESS_TOKEN_TTL_SECONDS', 15 * 60),
  idleTimeoutMs: envNumber('SESSION_IDLE_MINUTES', 30) * MINUTE,
  absoluteTimeoutMs: envNumber('SESSION_MAX_HOURS', 12) * 60 * MINUTE,
  activityWriteIntervalMs: 1 * MINUTE,
  refreshCookieName: 'cliently_rt',
  issuer: 'cliently-crm',
  audience: 'cliently-web'
}

function assertSessionConfig() {
  const secret = sessionConfig.accessTokenSecret
  if (!secret || secret.length < 32) {
    throw new Error('JWT_ACCESS_SECRET is missing or shorter than 32 characters. Add it to backend/.env.')
  }
}

module.exports = {sessionConfig,assertSessionConfig}