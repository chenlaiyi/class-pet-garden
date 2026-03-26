import { Router } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { db } from '../db.js'
import { authMiddleware } from '../middleware/auth.js'
import { verifyClassOwnership } from '../middleware/ownership.js'

const router = Router()

// 获取班级列表
router.get('/', authMiddleware, (req, res) => {
  const classes = db.prepare('SELECT * FROM classes WHERE user_id = ? ORDER BY created_at DESC').all(req.userId)
  res.json({ classes })
})

// 获取班级学生列表（包含标签）
router.get('/:classId/students', authMiddleware, (req, res) => {
  const cls = verifyClassOwnership(req.params.classId, req.userId)
  if (!cls) {
    return res.status(403).json({ error: '班级不存在或无权访问' })
  }
  
  const students = db.prepare('SELECT * FROM students WHERE class_id = ? ORDER BY name').all(req.params.classId)
  
  // 批量获取所有学生的标签
  const studentsWithTags = students.map(student => {
    const tags = db.prepare(`
      SELECT st.id, st.name, st.color, st.user_id, st.created_at
      FROM student_tags st
      JOIN student_tag_relations str ON st.id = str.tag_id
      WHERE str.student_id = ? AND st.user_id = ?
      ORDER BY str.created_at DESC
    `).all(student.id, req.userId)
    
    return { ...student, tags }
  })
  
  res.json({ students: studentsWithTags })
})

// 创建班级
router.post('/', authMiddleware, (req, res) => {
  const { name } = req.body
  const id = uuidv4()
  const now = Date.now()

  db.prepare('INSERT INTO classes (id, user_id, name, created_at, updated_at) VALUES (?, ?, ?, ?, ?)')
    .run(id, req.userId, name, now, now)

  res.json({ id, user_id: req.userId, name, created_at: now, updated_at: now })
})

// 更新班级
router.put('/:id', authMiddleware, (req, res) => {
  const { name } = req.body
  const cls = verifyClassOwnership(req.params.id, req.userId)

  if (!cls) {
    return res.status(404).json({ error: '班级不存在或无权修改' })
  }

  const now = Date.now()
  db.prepare('UPDATE classes SET name = ?, updated_at = ? WHERE id = ?').run(name, now, req.params.id)
  res.json({ success: true })
})

// 删除班级
router.delete('/:id', authMiddleware, (req, res) => {
  const cls = verifyClassOwnership(req.params.id, req.userId)
  if (!cls) {
    return res.status(404).json({ error: '班级不存在或无权删除' })
  }

  // 按外键依赖顺序删除：evaluation_records -> badges -> student_tag_relations -> students -> classes
  db.prepare('DELETE FROM evaluation_records WHERE class_id = ?').run(req.params.id)
  db.prepare('DELETE FROM badges WHERE student_id IN (SELECT id FROM students WHERE class_id = ?)').run(req.params.id)
  db.prepare('DELETE FROM student_tag_relations WHERE student_id IN (SELECT id FROM students WHERE class_id = ?)').run(req.params.id)
  db.prepare('DELETE FROM students WHERE class_id = ?').run(req.params.id)
  db.prepare('DELETE FROM classes WHERE id = ?').run(req.params.id)
  res.json({ success: true })
})

// POST /classes/join — 学生/用户通过邀请码加入班级
router.post('/join', authMiddleware, (req, res) => {
  const { inviteCode } = req.body
  if (!inviteCode) return res.status(400).json({ error: '邀请码不能为空' })

  const cls = db.prepare('SELECT * FROM classes WHERE invite_code = ?').get(inviteCode.toUpperCase())
  if (!cls) return res.status(404).json({ error: '邀请码无效' })

  const user = db.prepare('SELECT student_id FROM users WHERE id = ?').get(req.userId)
  if (!user?.student_id) {
    return res.status(403).json({ error: '当前账号未绑定学生，请联系老师处理' })
  }

  const student = db.prepare('SELECT * FROM students WHERE id = ?').get(user.student_id)
  if (!student) return res.status(404).json({ error: '学生信息不存在' })
  if (student.class_id && student.class_id !== cls.id) {
    return res.status(400).json({ error: '该学生已属于其他班级，需先退出原班级' })
  }
  if (student.class_id === cls.id) {
    return res.status(400).json({ error: '已经是这个班级的成员' })
  }

  db.prepare('UPDATE students SET class_id = ? WHERE id = ?').run(cls.id, student.id)
  res.json({ success: true, classId: cls.id, className: cls.name })
})

// GET /classes/invite — 获取当前班级的邀请码
router.get('/invite', authMiddleware, (req, res) => {
  const user = db.prepare('SELECT student_id FROM users WHERE id = ?').get(req.userId)
  let classId = null
  if (user?.student_id) {
    const student = db.prepare('SELECT class_id FROM students WHERE id = ?').get(user.student_id)
    classId = student?.class_id
  }
  if (!classId) return res.status(404).json({ error: '未加入任何班级' })
  const cls = db.prepare('SELECT id, name, invite_code FROM classes WHERE id = ?').get(classId)
  res.json({ classId: cls.id, className: cls.name, inviteCode: cls.invite_code })
})

export default router
