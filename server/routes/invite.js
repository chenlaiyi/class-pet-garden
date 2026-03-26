import { Router } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { db } from '../db.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

const INVITE_REWARD = 10  // 邀请人获得积分
const CODE_LENGTH = 8

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

// GET /api/invite/my-code — 获取当前用户的邀请码（没有则创建）
router.get('/my-code', authMiddleware, (req, res) => {
  const existing = db.prepare(
    'SELECT code, used_at FROM invite_codes WHERE creator_user_id = ? AND used_by_user_id IS NULL LIMIT 1'
  ).get(req.userId)

  if (existing) {
    return res.json({ code: existing.code, url: `https://pet.tapgo.cn/register?invite=${existing.code}` })
  }

  // 没有则新建
  const code = generateCode()
  db.prepare(
    'INSERT INTO invite_codes (id, code, creator_user_id, created_at) VALUES (?, ?, ?, ?)'
  ).run(uuidv4(), code, req.userId, Date.now())

  res.json({ code, url: `https://pet.tapgo.cn/register?invite=${code}` })
})

// GET /api/invite/stats — 邀请统计
router.get('/stats', authMiddleware, (req, res) => {
  const total = db.prepare(
    'SELECT COUNT(*) as count FROM invite_codes WHERE creator_user_id = ?'
  ).get(req.userId).count

  const used = db.prepare(
    'SELECT COUNT(*) as count FROM invite_codes WHERE creator_user_id = ? AND used_by_user_id IS NOT NULL'
  ).get(req.userId).count

  const pending = total - used

  res.json({ total, used, pending, rewardPerInvite: INVITE_REWARD })
})

// GET /api/invite/records — 邀请记录
router.get('/records', authMiddleware, (req, res) => {
  const records = db.prepare(`
    SELECT ic.code, ic.used_at, u.username as used_by_username
    FROM invite_codes ic
    LEFT JOIN users u ON u.id = ic.used_by_user_id
    WHERE ic.creator_user_id = ?
    ORDER BY ic.created_at DESC
  `).all(req.userId)

  res.json({ records })
})

// POST /api/invite/register — 注册时填写的邀请码（由 auth.js 注册流程内部调用）
router.post('/claim', authMiddleware, (req, res) => {
  const { inviteCode } = req.body
  if (!inviteCode) return res.status(400).json({ error: '邀请码不能为空' })

  // 查找邀请码
  const record = db.prepare(
    'SELECT * FROM invite_codes WHERE code = ? AND used_by_user_id IS NULL'
  ).get(inviteCode.toUpperCase())

  if (!record) {
    return res.status(400).json({ error: '邀请码无效或已被使用' })
  }

  if (record.creator_user_id === req.userId) {
    return res.status(400).json({ error: '不能使用自己的邀请码' })
  }

  // 标记已使用
  db.prepare(
    'UPDATE invite_codes SET used_by_user_id = ?, used_at = ? WHERE id = ?'
  ).run(req.userId, Date.now(), record.id)

  // 给邀请人 +10 积分
  db.prepare('UPDATE users SET points = points + ? WHERE id = ?').run(INVITE_REWARD, record.creator_user_id)

  // 给被邀请人 +10 积分
  db.prepare('UPDATE users SET points = points + ? WHERE id = ?').run(INVITE_REWARD, req.userId)

  // 记录被邀请人的 referred_by
  db.prepare('UPDATE users SET referred_by = ? WHERE id = ?').run(record.creator_user_id, req.userId)

  res.json({ success: true, reward: INVITE_REWARD, rewardForInvitee: INVITE_REWARD })
})

export default router
