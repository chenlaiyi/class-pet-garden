import { Router } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { db } from '../db.js'
import { hashPassword, verifyPassword } from '../utils/password.js'
import { generateToken, verifyToken } from '../utils/token.js'
import { authMiddleware } from '../middleware/auth.js'
import { requireNotUser } from '../middleware/ownership.js'

const router = Router()

// GET /api/student-accounts — 班级下的学生账号列表（管理员）
router.get('/', authMiddleware, requireNotUser, (req, res) => {
  if (!req.userIsAdmin) {
    return res.status(403).json({ error: '需要管理员权限' })
  }

  // 查找该老师创建班级的所有学生
  const students = db.prepare(`
    SELECT s.id, s.name, s.student_no, s.total_points, s.pet_type, s.pet_level,
           s.pet_status, u.id as account_id, u.username as account_username
    FROM students s
    JOIN classes c ON s.class_id = c.id
    LEFT JOIN users u ON u.student_id = s.id
    WHERE c.user_id = ?
    ORDER BY s.created_at ASC
  `).all(req.userId)

  res.json({ students })
})

// POST /api/student-accounts — 为学生创建登录账号（管理员）
router.post('/', authMiddleware, (req, res) => {
  if (!req.userIsAdmin) {
    return res.status(403).json({ error: '需要管理员权限' })
  }

  const { studentId, password } = req.body

  if (!studentId) {
    return res.status(400).json({ error: '缺少学生ID' })
  }
  if (!password || password.length < 4) {
    return res.status(400).json({ error: '密码至少4位' })
  }

  // 确认学生属于该老师
  const student = db.prepare(`
    SELECT s.* FROM students s
    JOIN classes c ON s.class_id = c.id
    WHERE s.id = ? AND c.user_id = ?
  `).get(studentId, req.userId)

  if (!student) {
    return res.status(404).json({ error: '学生不存在或无权操作' })
  }

  // 检查该学生是否已有账号
  const existingAccount = db.prepare('SELECT id FROM users WHERE student_id = ?').get(studentId)
  if (existingAccount) {
    return res.status(400).json({ error: '该学生已有登录账号' })
  }

  // 自动生成账号名：student_姓名拼音+随机后缀
  const baseName = student.name.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '').slice(0, 4)
  const suffix = Math.floor(Math.random() * 9000) + 1000
  const username = `stu_${baseName}${suffix}`
  const passwordHash = hashPassword(password)

  const userId = uuidv4()
  db.prepare(`
    INSERT INTO users (id, username, password_hash, is_guest, is_admin, student_id, created_at, points)
    VALUES (?, ?, ?, 0, 0, ?, ?, 100)
  `).run(userId, username, passwordHash, studentId, Date.now())

  // 把该学生的宠物所有权转给学生账号（原来属于老师账号）
  db.prepare('UPDATE pet_instances SET user_id = ? WHERE student_id = ? AND user_id = ?')
    .run(userId, studentId, req.userId)

  res.json({
    success: true,
    account: {
      id: userId,
      username,
      studentId,
      studentName: student.name
    }
  })
})

// DELETE /api/student-accounts/:studentId — 删除学生账号（管理员）
router.delete('/:studentId', authMiddleware, (req, res) => {
  if (!req.userIsAdmin) {
    return res.status(403).json({ error: '需要管理员权限' })
  }

  const { studentId } = req.params

  // 确认学生属于该老师
  const student = db.prepare(`
    SELECT s.* FROM students s
    JOIN classes c ON s.class_id = c.id
    WHERE s.id = ? AND c.user_id = ?
  `).get(studentId, req.userId)

  if (!student) {
    return res.status(404).json({ error: '学生不存在或无权操作' })
  }

  // 找到该学生的账号
  const studentUser = db.prepare('SELECT id FROM users WHERE student_id = ?').get(studentId)
  if (!studentUser) {
    return res.status(404).json({ error: '该学生没有登录账号' })
  }

  // 宠物所有权转回给老师
  db.prepare('UPDATE pet_instances SET user_id = ? WHERE student_id = ? AND user_id = ?')
    .run(req.userId, studentId, studentUser.id)

  // 删除学生账号
  db.prepare('DELETE FROM users WHERE id = ?').run(studentUser.id)

  res.json({ success: true })
})

// POST /api/student-accounts/login — 学生账号登录（无需管理员）
router.post('/login', (req, res) => {
  const { username, password } = req.body

  if (!username || !password) {
    return res.status(400).json({ error: '请输入账号和密码' })
  }

  const user = db.prepare(
    'SELECT id, username, password_hash, student_id, is_guest, is_admin FROM users WHERE username = ?'
  ).get(username)

  if (!user) {
    return res.status(401).json({ error: '账号或密码错误' })
  }

  // 必须是学生账号（student_id 不为空且非管理员）
  if (!user.student_id || user.is_admin) {
    return res.status(401).json({ error: '账号或密码错误' })
  }

  if (!verifyPassword(password, user.password_hash)) {
    return res.status(401).json({ error: '账号或密码错误' })
  }

  // 获取学生信息
  const student = db.prepare('SELECT * FROM students WHERE id = ?').get(user.student_id)
  if (!student) {
    return res.status(401).json({ error: '账号或密码错误' })
  }

  const token = generateToken(user.id)
  res.json({
    success: true,
    token,
    user: {
      id: user.id,
      username: user.username,
      studentId: user.student_id,
      studentName: student.name,
      isGuest: false,
      isAdmin: false,
      isStudent: true
    }
  })
})

// GET /api/student-accounts/me — 学生账号查看自己的信息
router.get('/me', authMiddleware, (req, res) => {
  const user = db.prepare('SELECT id, username, student_id, is_guest, is_admin FROM users WHERE id = ?').get(req.userId)

  if (!user || !user.student_id) {
    return res.status(403).json({ error: '无权限' })
  }

  const student = db.prepare('SELECT * FROM students WHERE id = ?').get(user.student_id)
  if (!student) {
    return res.status(404).json({ error: '学生信息不存在' })
  }

  // 获取班级信息
  const cls = db.prepare('SELECT * FROM classes WHERE id = ?').get(student.class_id)

  // 获取最近评价记录
  const records = db.prepare(`
    SELECT * FROM evaluation_records WHERE student_id = ? ORDER BY timestamp DESC LIMIT 20
  `).all(user.student_id)

  // 获取宠物实例
  const petInstance = db.prepare('SELECT * FROM pet_instances WHERE student_id = ?').get(user.student_id)

  res.json({
    student: {
      ...student,
      className: cls?.name,
      records,
      petInstance
    }
  })
})

export default router
