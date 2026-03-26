import { Router } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { db } from '../db.js'
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth.js'

const router = Router()

function codePrefix(templateId) {
  const map = {
    shiba: 'SH',
    corgi: 'CG',
    golden: 'GD',
    bichon: 'BC',
    'orange-cat': 'OC',
    ragdoll: 'RD',
    bunny: 'BN',
    hamster: 'HM',
    duckling: 'DK',
    alpaca: 'AP',
    unicorn: 'UC',
    'baby-dragon': 'BD'
  }
  return map[templateId] || 'PT'
}

function generatePetCode(templateId) {
  const prefix = codePrefix(templateId)
  const count = db.prepare('SELECT COUNT(*) as count FROM pet_instances WHERE template_id = ?').get(templateId)?.count || 0
  return `PG-${prefix}-${String(count + 1).padStart(6, '0')}`
}

// 列出当前用户的宠物实例
router.get('/', authMiddleware, (req, res) => {
  const items = db.prepare(`
    SELECT pi.*, s.name as student_name, c.name as class_name
    FROM pet_instances pi
    LEFT JOIN students s ON s.id = pi.student_id
    LEFT JOIN classes c ON c.id = pi.class_id
    WHERE pi.user_id = ?
    ORDER BY pi.created_at DESC
  `).all(req.userId)
  res.json({ items })
})

// 创建宠物实例
router.post('/', authMiddleware, (req, res) => {
  const { templateId, displayName, studentId, classId } = req.body
  if (!templateId || !displayName || !studentId || !classId) {
    return res.status(400).json({ error: '缺少必要参数' })
  }

  const id = uuidv4()
  const code = generatePetCode(templateId)
  const now = Date.now()

  db.prepare(`
    INSERT INTO pet_instances (id, user_id, template_id, code, display_name, student_id, class_id, level, exp, status, adopted_at, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 1, 0, 'alive', ?, ?, ?)
  `).run(id, req.userId, templateId, code, displayName, studentId, classId, now, now, now)

  const shortCode = code.replace(/-/g, '').slice(-8)
  db.prepare(`
    INSERT INTO pet_carriers (id, pet_instance_id, carrier_type, short_code, display_code, status, created_at, updated_at)
    VALUES (?, ?, 'qr', ?, ?, 'active', ?, ?)
  `).run(uuidv4(), id, shortCode, code, now, now)

  res.json({ success: true, id, code, shortCode })
})

// 短码解析
router.get('/resolve/:shortCode', optionalAuthMiddleware, (req, res) => {
  const item = db.prepare(`
    SELECT pi.*, pc.short_code, s.name as student_name, c.name as class_name
    FROM pet_carriers pc
    JOIN pet_instances pi ON pi.id = pc.pet_instance_id
    LEFT JOIN students s ON s.id = pi.student_id
    LEFT JOIN classes c ON c.id = pi.class_id
    WHERE pc.short_code = ? AND pc.status = 'active'
    LIMIT 1
  `).get(req.params.shortCode)

  if (!item) return res.status(404).json({ error: '未找到宠物入口' })
  res.json({ item })
})

// 按完整码查
router.get('/code/:code', optionalAuthMiddleware, (req, res) => {
  const item = db.prepare(`
    SELECT pi.*, s.name as student_name, c.name as class_name
    FROM pet_instances pi
    LEFT JOIN students s ON s.id = pi.student_id
    LEFT JOIN classes c ON c.id = pi.class_id
    WHERE pi.code = ?
    LIMIT 1
  `).get(req.params.code)

  if (!item) return res.status(404).json({ error: '未找到宠物实例' })
  res.json({ item })
})

// 按 ID 查单个宠物实例
router.get('/:id', authMiddleware, (req, res) => {
  const item = db.prepare(`
    SELECT pi.*, s.name as student_name, c.name as class_name
    FROM pet_instances pi
    LEFT JOIN students s ON s.id = pi.student_id
    LEFT JOIN classes c ON c.id = pi.class_id
    WHERE pi.id = ? AND pi.user_id = ?
    LIMIT 1
  `).get(req.params.id, req.userId)

  if (!item) return res.status(404).json({ error: '未找到宠物实例' })
  res.json({ item })
})

// 更新宠物（display_name、level、exp、status）
router.put('/:id', authMiddleware, (req, res) => {
  const { displayName, level, exp, status } = req.body

  // 验证归属
  const existing = db.prepare('SELECT id FROM pet_instances WHERE id = ? AND user_id = ?').get(req.params.id, req.userId)
  if (!existing) return res.status(404).json({ error: '未找到宠物实例' })

  const updates = []
  const values = []

  if (displayName !== undefined) { updates.push('display_name = ?'); values.push(displayName) }
  if (level !== undefined) { updates.push('level = ?'); values.push(level) }
  if (exp !== undefined) { updates.push('exp = ?'); values.push(exp) }
  if (status !== undefined) { updates.push('status = ?'); values.push(status) }

  if (updates.length === 0) return res.status(400).json({ error: '没有需要更新的字段' })

  updates.push('updated_at = ?')
  values.push(Date.now())
  values.push(req.params.id)

  db.prepare(`UPDATE pet_instances SET ${updates.join(', ')} WHERE id = ?`).run(...values)
  res.json({ success: true })
})

// 删除宠物实例
router.delete('/:id', authMiddleware, (req, res) => {
  const existing = db.prepare('SELECT id FROM pet_instances WHERE id = ? AND user_id = ?').get(req.params.id, req.userId)
  if (!existing) return res.status(404).json({ error: '未找到宠物实例' })

  // 删除关联的 carrier
  db.prepare('DELETE FROM pet_carriers WHERE pet_instance_id = ?').run(req.params.id)
  // 删除宠物实例
  db.prepare('DELETE FROM pet_instances WHERE id = ?').run(req.params.id)
  res.json({ success: true })
})

// 绑定宠物到学生
router.post('/bind', authMiddleware, (req, res) => {
  const { petInstanceId, studentId } = req.body
  if (!petInstanceId || !studentId) {
    return res.status(400).json({ error: '缺少必要参数' })
  }

  // 验证宠物归属
  const pet = db.prepare('SELECT * FROM pet_instances WHERE id = ? AND user_id = ?').get(petInstanceId, req.userId)
  if (!pet) return res.status(404).json({ error: '未找到宠物实例' })

  // 验证学生归属（通过 ownership middleware 逻辑）
  const student = db.prepare(`
    SELECT s.* FROM students s
    JOIN classes c ON c.id = s.class_id
    WHERE s.id = ? AND c.user_id = ?
  `).get(studentId, req.userId)
  if (!student) return res.status(404).json({ error: '学生不存在或无权访问' })

  // 检查学生是否已有宠物
  if (student.pet_instance_id) {
    return res.status(400).json({ error: '该学生已有宠物，不可重复领养' })
  }

  const now = Date.now()

  // 更新学生的 pet_type 和 pet_instance_id
  db.prepare('UPDATE students SET pet_type = ?, pet_instance_id = ?, pet_level = 1, pet_exp = 0 WHERE id = ?')
    .run(pet.template_id, petInstanceId, studentId)

  // 更新宠物实例的 student_id
  db.prepare('UPDATE pet_instances SET student_id = ?, adopted_at = ?, updated_at = ? WHERE id = ?')
    .run(studentId, now, now, petInstanceId)

  res.json({ success: true })
})

// 解除绑定
router.post('/unbind', authMiddleware, (req, res) => {
  const { petInstanceId } = req.body
  if (!petInstanceId) return res.status(400).json({ error: '缺少宠物实例ID' })

  const pet = db.prepare('SELECT * FROM pet_instances WHERE id = ? AND user_id = ?').get(petInstanceId, req.userId)
  if (!pet) return res.status(404).json({ error: '未找到宠物实例' })

  if (pet.student_id) {
    // 解除学生的宠物绑定
    db.prepare('UPDATE students SET pet_type = NULL, pet_instance_id = NULL, pet_level = 1, pet_exp = 0 WHERE id = ?')
      .run(pet.student_id)
  }

  // 清空宠物实例的 student_id
  db.prepare('UPDATE pet_instances SET student_id = NULL, updated_at = ? WHERE id = ?')
    .run(Date.now(), petInstanceId)

  res.json({ success: true })
})

// 宠物数字身份卡数据
router.get('/:id/identity', optionalAuthMiddleware, (req, res) => {
  const pet = db.prepare(`
    SELECT pi.*, s.name as student_name, c.name as class_name,
           u.username as owner_name
    FROM pet_instances pi
    LEFT JOIN students s ON s.id = pi.student_id
    LEFT JOIN classes c ON c.id = pi.class_id
    LEFT JOIN users u ON u.id = pi.user_id
    WHERE pi.id = ?
    LIMIT 1
  `).get(req.params.id)

  if (!pet) return res.status(404).json({ error: '未找到宠物实例' })

  const baseUrl = process.env.BASE_URL || `http://localhost:3002`
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(`${baseUrl}/p/${pet.code}`)}`

  const identity = {
    id: pet.id,
    code: pet.code,
    displayName: pet.display_name,
    templateId: pet.template_id,
    level: pet.level,
    exp: pet.exp,
    status: pet.status,
    studentName: pet.student_name || null,
    className: pet.class_name || null,
    ownerName: pet.owner_name || null,
    adoptedAt: pet.adopted_at ? new Date(pet.adopted_at).toLocaleDateString('zh-CN') : null,
    createdAt: pet.created_at ? new Date(pet.created_at).toLocaleDateString('zh-CN') : null,
    qrUrl,
    shortCode: db.prepare('SELECT short_code FROM pet_carriers WHERE pet_instance_id = ? LIMIT 1').get(pet.id)?.short_code || null
  }

  res.json({ item: identity })
})

// 宠物主页二维码图片 URL
router.get('/:id/qr', optionalAuthMiddleware, (req, res) => {
  const pet = db.prepare('SELECT code FROM pet_instances WHERE id = ?').get(req.params.id)
  if (!pet) return res.status(404).json({ error: '未找到宠物实例' })

  const baseUrl = process.env.BASE_URL || `http://localhost:3002`
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(`${baseUrl}/p/${pet.code}`)}`
  res.json({ url: qrUrl })
})

export default router
