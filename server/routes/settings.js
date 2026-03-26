import { Router } from 'express'
import { db } from '../db.js'
import { authMiddleware } from '../middleware/auth.js'
import { requireNotUser } from '../middleware/ownership.js'
import { calculateLevel } from '../utils/level.js'

const router = Router()

// 获取设置（公开接口）
router.get('/', (req, res) => {
  const settings = db.prepare('SELECT * FROM settings').all()
  const result = {}
  for (const s of settings) {
    result[s.key] = JSON.parse(s.value)
  }
  res.json(result)
})

// 修复经验值（将 pet_exp 与 total_points 同步）
router.post('/fix-exp', authMiddleware, requireNotUser, (req, res) => {
  // Sync pet_exp with total_points for students with pets (只处理当前用户的班级)
  const result = db.prepare(`
    UPDATE students SET pet_exp = MAX(0, total_points)
    WHERE pet_type IS NOT NULL
    AND class_id IN (SELECT id FROM classes WHERE user_id = ?)
  `).run(req.userId)
  res.json({ success: true, updated: result.changes })
})

// 获取排行榜
router.get('/ranking/:classId', authMiddleware, requireNotUser, (req, res) => {
  // 验证班级归属
  const cls = db.prepare('SELECT * FROM classes WHERE id = ?').get(req.params.classId)
  if (!cls || cls.user_id !== req.userId) {
    return res.status(403).json({ error: '无权访问此班级' })
  }

  const ranking = db.prepare(`
    SELECT s.*,
           (SELECT COUNT(*) FROM badges WHERE student_id = s.id) as badge_count
    FROM students s
    WHERE s.class_id = ?
    ORDER BY s.total_points DESC, s.pet_level DESC
  `).all(req.params.classId)
  res.json({ ranking })
})

// user 角色专用：只能看自己所在班级的排行榜
router.get('/ranking/me', authMiddleware, (req, res) => {
  if (req.userRole !== 'user') {
    return res.status(403).json({ error: '此接口仅对普通用户开放' })
  }
  const user = db.prepare('SELECT student_id FROM users WHERE id = ?').get(req.userId)
  if (!user?.student_id) return res.status(403).json({ error: '未绑定学生账号' })
  const student = db.prepare('SELECT class_id FROM students WHERE id = ?').get(user.student_id)
  if (!student?.class_id) return res.status(403).json({ error: '未加入任何班级' })

  const ranking = db.prepare(`
    SELECT s.*,
           (SELECT COUNT(*) FROM badges WHERE student_id = s.id) as badge_count
    FROM students s
    WHERE s.class_id = ?
    ORDER BY s.total_points DESC, s.pet_level DESC
  `).all(student.class_id)
  res.json({ ranking })
})

export default router
