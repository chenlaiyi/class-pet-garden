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

export default router
