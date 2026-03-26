import { Router } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { db } from '../db.js'
import { authMiddleware } from '../middleware/auth.js'
import { isSuperAdmin, isAtLeastTeacher } from '../middleware/ownership.js'
import { hashPassword } from '../utils/password.js'

const router = Router()

// 仅 super_admin 可访问
function requireSuperAdmin(req, res, next) {
  if (!isSuperAdmin(req.userId)) return res.status(403).json({ error: '需要超级管理员权限' })
  next()
}

// 获取所有老师及其班级统计
router.get('/teachers', authMiddleware, requireSuperAdmin, (req, res) => {
  const teachers = db.prepare(`
    SELECT id, username, created_at, role, teacher_id
    FROM users
    WHERE is_guest = 0 AND role IN ('teacher', 'super_admin')
    ORDER BY created_at DESC
  `).all()

  const result = teachers.map(teacher => {
    const classes = db.prepare(`
      SELECT c.id, c.name,
             (SELECT count(*) FROM students s WHERE s.class_id = c.id) as student_count,
             (SELECT count(*) FROM evaluation_records e WHERE e.class_id = c.id) as eval_count
      FROM classes c WHERE c.user_id = ?
    `).all(teacher.id)
    const totalStudents = classes.reduce((sum, c) => sum + c.student_count, 0)
    const totalEvals = classes.reduce((sum, c) => sum + c.eval_count, 0)
    return {
      id: teacher.id,
      username: teacher.username,
      role: teacher.role,
      teacherId: teacher.teacher_id,
      createdAt: teacher.created_at,
      classCount: classes.length,
      totalStudents,
      totalEvals,
      classes
    }
  })

  res.json({ teachers: result })
})

// 获取所有普通用户
router.get('/users', authMiddleware, requireSuperAdmin, (req, res) => {
  const users = db.prepare(`
    SELECT u.id, u.username, u.created_at, u.role, u.teacher_id, u.student_id,
           s.name as student_name, c.name as class_name, c.id as class_id
    FROM users u
    LEFT JOIN students s ON u.student_id = s.id
    LEFT JOIN classes c ON s.class_id = c.id
    WHERE u.role = 'user' AND u.is_guest = 0
    ORDER BY u.created_at DESC
  `).all()
  res.json({ users })
})

// 创建老师账号
router.post('/teachers', authMiddleware, requireSuperAdmin, (req, res) => {
  const { username, password } = req.body
  if (!username || !password) return res.status(400).json({ error: '用户名和密码不能为空' })
  if (password.length < 6) return res.status(400).json({ error: '密码至少6位' })
  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username)
  if (existing) return res.status(400).json({ error: '用户名已存在' })
  const id = uuidv4()
  const now = Date.now()
  db.prepare('INSERT INTO users (id, username, password_hash, is_guest, created_at, role, teacher_id) VALUES (?, ?, ?, 0, ?, ?, ?)')
    .run(id, username, hashPassword(password), now, 'teacher', req.userId)
  res.json({ id, username, role: 'teacher', teacherId: req.userId, createdAt: now })
})

// 创建普通用户账号
router.post('/users', authMiddleware, requireSuperAdmin, (req, res) => {
  const { username, password, teacherId } = req.body
  if (!username || !password) return res.status(400).json({ error: '用户名和密码不能为空' })
  if (password.length < 6) return res.status(400).json({ error: '密码至少6位' })
  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username)
  if (existing) return res.status(400).json({ error: '用户名已存在' })
  const id = uuidv4()
  const now = Date.now()
  db.prepare('INSERT INTO users (id, username, password_hash, is_guest, created_at, role, teacher_id) VALUES (?, ?, ?, 0, ?, ?, ?)')
    .run(id, username, hashPassword(password), now, 'user', teacherId || null)
  res.json({ id, username, role: 'user', teacherId: teacherId || null, createdAt: now })
})

// 更新用户角色
router.put('/users/:id/role', authMiddleware, requireSuperAdmin, (req, res) => {
  const { role, teacherId } = req.body
  if (!['user', 'teacher'].includes(role)) return res.status(400).json({ error: '无效的角色' })
  const target = db.prepare('SELECT id FROM users WHERE id = ?').get(req.params.id)
  if (!target) return res.status(404).json({ error: '用户不存在' })
  // 不能把 super_admin 降级
  const targetUser = db.prepare('SELECT role FROM users WHERE id = ?').get(req.params.id)
  if (targetUser?.role === 'super_admin') return res.status(403).json({ error: '不能修改超级管理员角色' })
  db.prepare('UPDATE users SET role = ?, teacher_id = ? WHERE id = ?')
    .run(role, role === 'super_admin' ? null : (teacherId || null), req.params.id)
  res.json({ success: true })
})

// 删除老师（不能删 super_admin）
router.delete('/teachers/:id', authMiddleware, requireSuperAdmin, (req, res) => {
  const teacher = db.prepare('SELECT role FROM users WHERE id = ?').get(req.params.id)
  if (!teacher) return res.status(404).json({ error: '用户不存在' })
  if (teacher.role === 'super_admin') return res.status(403).json({ error: '不能删除超级管理员' })
  // 删除该老师的班级（含学生）
  const classes = db.prepare('SELECT id FROM classes WHERE user_id = ?').all(req.params.id)
  for (const cls of classes) {
    db.prepare('DELETE FROM evaluation_records WHERE class_id = ?').run(cls.id)
    db.prepare('DELETE FROM badges WHERE student_id IN (SELECT id FROM students WHERE class_id = ?)').run(cls.id)
    db.prepare('DELETE FROM student_tag_relations WHERE student_id IN (SELECT id FROM students WHERE class_id = ?)').run(cls.id)
    db.prepare('DELETE FROM students WHERE class_id = ?').run(cls.id)
    db.prepare('DELETE FROM classes WHERE id = ?').run(cls.id)
  }
  db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id)
  res.json({ success: true })
})

// 获取系统统计概览
router.get('/stats', authMiddleware, requireSuperAdmin, (req, res) => {
  const stats = {
    teachers: db.prepare("SELECT count(*) as count FROM users WHERE role = 'teacher'").get().count,
    users: db.prepare("SELECT count(*) as count FROM users WHERE role = 'user' AND is_guest = 0").get().count,
    classes: db.prepare('SELECT count(*) as count FROM classes').get().count,
    students: db.prepare('SELECT count(*) as count FROM students').get().count,
    evaluations: db.prepare('SELECT count(*) as count FROM evaluation_records').get().count,
    todayEvaluations: db.prepare(`
      SELECT count(*) as count FROM evaluation_records
      WHERE date(timestamp/1000, 'unixepoch', 'localtime') = date('now', 'localtime')
    `).get().count
  }
  const dailyStats = db.prepare(`
    SELECT date(timestamp/1000, 'unixepoch', 'localtime') as date, count(*) as count
    FROM evaluation_records
    WHERE timestamp >= (strftime('%s', 'now') - 7*24*60*60) * 1000
    GROUP BY date ORDER BY date DESC
  `).all()
  res.json({ stats, dailyStats })
})

// 近7天详细统计数据
router.get('/daily-stats', authMiddleware, requireSuperAdmin, (req, res) => {
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
  const toMap = (arr) => {
    const m = {}; arr.forEach(item => { m[item.date] = item.count }); return m
  }
  const newUsers = db.prepare(`
    SELECT date(created_at/1000, 'unixepoch', 'localtime') as date, count(*) as count
    FROM users WHERE is_guest = 0 AND created_at >= ? GROUP BY date
  `).all(sevenDaysAgo)
  const newClasses = db.prepare(`
    SELECT date(created_at/1000, 'unixepoch', 'localtime') as date, count(*) as count
    FROM classes WHERE created_at >= ? GROUP BY date
  `).all(sevenDaysAgo)
  const newStudents = db.prepare(`
    SELECT date(created_at/1000, 'unixepoch', 'localtime') as date, count(*) as count
    FROM students WHERE created_at >= ? GROUP BY date
  `).all(sevenDaysAgo)
  const evals = db.prepare(`
    SELECT date(timestamp/1000, 'unixepoch', 'localtime') as date, count(*) as count
    FROM evaluation_records WHERE timestamp >= ? GROUP BY date
  `).all(sevenDaysAgo)
  const uMap = toMap(newUsers)
  const cMap = toMap(newClasses)
  const sMap = toMap(newStudents)
  const eMap = toMap(evals)
  const now = new Date()
  const dates = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now); d.setDate(d.getDate() - i)
    dates.push(d.toLocaleDateString('sv-SE'))
  }
  const result = dates.map(date => ({
    date,
    newUsers: uMap[date] || 0,
    newClasses: cMap[date] || 0,
    newStudents: sMap[date] || 0,
    evaluations: eMap[date] || 0
  }))
  res.json({ dailyStats: result })
})

// ─── 老师端：查看自己管理的用户 ────────────────────────────────────────
router.get('/my-users', authMiddleware, (req, res) => {
  if (!isAtLeastTeacher(req.userId)) return res.status(403).json({ error: '权限不足' })
  const users = db.prepare(`
    SELECT u.id, u.username, u.created_at, u.role, u.teacher_id, u.student_id,
           s.name as student_name, c.name as class_name, c.id as class_id
    FROM users u
    LEFT JOIN students s ON u.student_id = s.id
    LEFT JOIN classes c ON s.class_id = c.id
    WHERE u.role = 'user' AND u.is_guest = 0 AND u.teacher_id = ?
    ORDER BY u.created_at DESC
  `).all(req.userId)
  res.json({ users })
})

// ─── 老师端：创建用户账号（绑定到该老师）────────────────────────────────
router.post('/my-users', authMiddleware, (req, res) => {
  if (!isAtLeastTeacher(req.userId)) return res.status(403).json({ error: '权限不足' })
  const { username, password } = req.body
  if (!username || !password) return res.status(400).json({ error: '用户名和密码不能为空' })
  if (password.length < 6) return res.status(400).json({ error: '密码至少6位' })
  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username)
  if (existing) return res.status(400).json({ error: '用户名已存在' })
  const id = uuidv4()
  const now = Date.now()
  db.prepare(
    'INSERT INTO users (id, username, password_hash, is_guest, created_at, role, teacher_id) VALUES (?, ?, ?, 0, ?, ?, ?)'
  ).run(id, username, hashPassword(password), now, 'user', req.userId)
  res.json({ id, username, role: 'user', teacherId: req.userId, createdAt: now })
})

// ─── 老师端：删除自己管理的用户 ─────────────────────────────────────────
router.delete('/my-users/:id', authMiddleware, (req, res) => {
  if (!isAtLeastTeacher(req.userId)) return res.status(403).json({ error: '权限不足' })
  const target = db.prepare('SELECT * FROM users WHERE id = ? AND teacher_id = ?').get(req.params.id, req.userId)
  if (!target) return res.status(404).json({ error: '用户不存在或无权删除' })
  // 级联删除关联学生（如果有）
  if (target.student_id) {
    db.prepare('DELETE FROM evaluation_records WHERE student_id = ?').run(target.student_id)
    db.prepare('DELETE FROM badges WHERE student_id = ?').run(target.student_id)
    db.prepare('DELETE FROM student_tag_relations WHERE student_id = ?').run(target.student_id)
    db.prepare('DELETE FROM students WHERE id = ?').run(target.student_id)
  }
  db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id)
  res.json({ success: true })
})

export default router
