import { Router } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { db } from '../db.js'
import { hashPassword, verifyPassword } from '../utils/password.js'
import { generateToken, verifyToken } from '../utils/token.js'

const router = Router()

// POST /api/auth/register
router.post('/register', (req, res) => {
  const { username, password, inviteCode } = req.body
  if (!username || !password) return res.status(400).json({ error: '用户名和密码不能为空' })
  if (password.length < 6) return res.status(400).json({ error: '密码至少6位' })

  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username)
  if (existing) return res.status(400).json({ error: '用户名已存在' })

  const userId = uuidv4()
  const passwordHash = hashPassword(password)
  const now = Date.now()

  db.prepare(
    'INSERT INTO users (id, username, password_hash, is_guest, created_at, role) VALUES (?, ?, ?, 0, ?, ?)'
  ).run(userId, username, passwordHash, now, 'user')

  // 如果提供了邀请码，自动入班
  if (inviteCode) {
    const cls = db.prepare('SELECT * FROM classes WHERE invite_code = ?').get(inviteCode.toUpperCase())
    if (cls) {
      const studentId = uuidv4()
      db.prepare(
        'INSERT INTO students (id, class_id, user_id, name, total_points, pet_level, pet_exp, pet_status, created_at) VALUES (?, ?, ?, ?, 0, 1, 0, ?, ?)'
      ).run(studentId, cls.id, userId, username, 'alive', now)
      db.prepare('UPDATE users SET student_id = ? WHERE id = ?').run(studentId, userId)
    }
  }

  const token = generateToken(userId)
  res.json({
    success: true,
    token,
    user: { id: userId, username, isGuest: false, role: 'user' }
  })
})

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { username, password } = req.body
  if (!username || !password) return res.status(400).json({ error: '用户名和密码不能为空' })

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username)
  if (!user) return res.status(401).json({ error: '用户名或密码错误' })
  if (user.is_guest) return res.status(401).json({ error: '用户名或密码错误' })
  if (!verifyPassword(password, user.password_hash)) return res.status(401).json({ error: '用户名或密码错误' })

  const token = generateToken(user.id)
  res.json({
    success: true,
    token,
    user: {
      id: user.id,
      username: user.username,
      isGuest: false,
      isAdmin: !!user.is_admin,
      role: user.role || 'user',
      studentId: user.student_id || null
    }
  })
})

// GET /api/auth/me
router.get('/me', (req, res) => {
  let token = req.headers.authorization?.replace('Bearer ', '')
  if (!token || token === 'guest') return res.status(401).json({ error: '未登录' })
  const payload = verifyToken(token)
  if (!payload) return res.status(401).json({ error: '未登录或登录已过期' })

  const user = db.prepare('SELECT id, username, is_guest, is_admin, role, student_id FROM users WHERE id = ?').get(payload.userId)
  if (!user) return res.status(401).json({ error: '用户不存在' })

  res.json({
    user: {
      id: user.id,
      username: user.username,
      isGuest: !!user.is_guest,
      isAdmin: !!user.is_admin,
      role: user.role || 'user',
      studentId: user.student_id || null
    }
  })
})

export default router
