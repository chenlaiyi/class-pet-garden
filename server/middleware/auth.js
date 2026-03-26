import { verifyToken } from '../utils/token.js'
import { db } from '../db.js'

export function authMiddleware(req, res, next) {
  let token = req.headers.authorization?.replace('Bearer ', '')

  // 处理游客模式
  if (token === 'guest') {
    const guest = db.prepare('SELECT id FROM users WHERE username = ?').get('guest')
    if (guest) {
      req.userId = guest.id
      req.userRole = 'user'
      req.userIsAdmin = false
      return next()
    }
    return res.status(401).json({ error: '游客模式不可用' })
  }

  const payload = verifyToken(token)

  if (!payload) {
    return res.status(401).json({ error: '未登录或登录已过期' })
  }

  req.userId = payload.userId
  const user = db.prepare('SELECT is_admin, role FROM users WHERE id = ?').get(payload.userId)
  req.userRole = user?.role || 'user'
  req.userIsAdmin = user?.is_admin === 1 || req.userRole === 'super_admin'
  next()
}

export function optionalAuthMiddleware(req, res, next) {
  let token = req.headers.authorization?.replace('Bearer ', '')

  // 处理游客模式
  if (token === 'guest') {
    const guest = db.prepare('SELECT id FROM users WHERE username = ?').get('guest')
    if (guest) {
      req.userId = guest.id
      req.userRole = 'user'
      req.userIsAdmin = false
    }
    return next()
  }

  const payload = verifyToken(token)

  if (payload) {
    req.userId = payload.userId
    const user = db.prepare('SELECT is_admin, role FROM users WHERE id = ?').get(payload.userId)
    req.userRole = user?.role || 'user'
    req.userIsAdmin = user?.is_admin === 1 || req.userRole === 'super_admin'
  }

  next()
}

// 权限等级
export const ROLE_LEVELS = {
  user: 1,
  teacher: 2,
  super_admin: 3,
}

/**
 * 检查当前用户是否至少达到指定权限等级
 * @param {string} required 需要的角色
 */
export function requireRole(required) {
  return (req, res, next) => {
    const level = ROLE_LEVELS[req.userRole] || 0
    const requiredLevel = ROLE_LEVELS[required] || 0
    if (level < requiredLevel) {
      return res.status(403).json({ error: '权限不足' })
    }
    next()
  }
}

/**
 * 禁止 user 角色的所有写操作（POST/PUT/PATCH/DELETE）
 * 挂在需要保护的路由上
 */
export function blockUserWrite(req, res, next) {
  if (req.userRole === 'user') {
    return res.status(403).json({ error: '权限不足，用户角色无法执行此操作' })
  }
  next()
}
