/**
 * 资源所有权验证工具 — 三层权限体系
 * super_admin: 可操作所有资源
 * teacher: 只能操作自己创建的（通过 teacher_id / user_id 关联）
 * user: 只能读，不能写
 */
import { db } from '../db.js'

// ─── 辅助：判断用户是否 super_admin ───────────────────────────────────
export function isSuperAdmin(userId) {
  const user = db.prepare('SELECT role FROM users WHERE id = ?').get(userId)
  return user?.role === 'super_admin'
}

// ─── 辅助：判断用户是否 teacher 或 super_admin ──────────────────────────
export function isAtLeastTeacher(userId) {
  const user = db.prepare('SELECT role FROM users WHERE id = ?').get(userId)
  return user?.role === 'teacher' || user?.role === 'super_admin'
}

// ─── 班级 ─────────────────────────────────────────────────────────────

/**
 * 验证班级所有权（仅创建者）
 * super_admin 可操作所有班级
 */
export function verifyClassOwnership(classId, userId) {
  if (isSuperAdmin(userId)) {
    return db.prepare('SELECT * FROM classes WHERE id = ?').get(classId)
  }
  return db.prepare('SELECT * FROM classes WHERE id = ? AND user_id = ?').get(classId, userId)
}

/**
 * 列出用户可见的班级（super_admin 全部，其他只看自己创建的）
 */
export function listClassesForUser(userId) {
  if (isSuperAdmin(userId)) {
    return db.prepare('SELECT * FROM classes ORDER BY created_at DESC').all()
  }
  return db.prepare('SELECT * FROM classes WHERE user_id = ? ORDER BY created_at DESC').all(userId)
}

// ─── 学生 ─────────────────────────────────────────────────────────────

/**
 * 验证学生所有权
 * super_admin 可操作所有学生
 */
export function verifyStudentOwnership(studentId, userId) {
  if (isSuperAdmin(userId)) {
    return db.prepare('SELECT s.* FROM students s WHERE s.id = ?').get(studentId)
  }
  return db.prepare(`
    SELECT s.* FROM students s
    JOIN classes c ON s.class_id = c.id
    WHERE s.id = ? AND c.user_id = ?
  `).get(studentId, userId)
}

/**
 * 列出用户可见的学生
 * super_admin: 全部
 * teacher: 自己班级里的
 */
export function listStudentsForUser(userId) {
  if (isSuperAdmin(userId)) {
    return db.prepare('SELECT * FROM students ORDER BY name').all()
  }
  return db.prepare(`
    SELECT s.* FROM students s
    JOIN classes c ON s.class_id = c.id
    WHERE c.user_id = ?
    ORDER BY s.name
  `).all(userId)
}

// ─── 评价记录 ─────────────────────────────────────────────────────────

export function verifyRecordOwnership(recordId, userId) {
  if (isSuperAdmin(userId)) {
    return db.prepare('SELECT * FROM evaluation_records WHERE id = ?').get(recordId)
  }
  return db.prepare(`
    SELECT er.* FROM evaluation_records er
    JOIN classes c ON er.class_id = c.id
    WHERE er.id = ? AND c.user_id = ?
  `).get(recordId, userId)
}

// ─── 规则 ─────────────────────────────────────────────────────────────

export function verifyRuleOwnership(ruleId, userId) {
  if (isSuperAdmin(userId)) {
    return db.prepare('SELECT * FROM evaluation_rules WHERE id = ?').get(ruleId)
  }
  return db.prepare('SELECT * FROM evaluation_rules WHERE id = ? AND user_id = ?').get(ruleId, userId)
}

export function listRulesForUser(userId) {
  if (isSuperAdmin(userId)) {
    return db.prepare('SELECT * FROM evaluation_rules ORDER BY created_at').all()
  }
  return db.prepare('SELECT * FROM evaluation_rules WHERE user_id = ? OR user_id IS NULL ORDER BY created_at').all(userId)
}

// ─── 标签 ─────────────────────────────────────────────────────────────

export function verifyTagOwnership(tagId, userId) {
  if (isSuperAdmin(userId)) {
    return db.prepare('SELECT * FROM student_tags WHERE id = ?').get(tagId)
  }
  return db.prepare('SELECT * FROM student_tags WHERE id = ? AND user_id = ?').get(tagId, userId)
}

export function listTagsForUser(userId) {
  if (isSuperAdmin(userId)) {
    return db.prepare('SELECT * FROM student_tags ORDER BY created_at').all()
  }
  return db.prepare('SELECT * FROM student_tags WHERE user_id = ? ORDER BY created_at').all(userId)
}

// ─── 批量验证学生所有权 ────────────────────────────────────────────────

export function verifyStudentsOwnership(studentIds, userId) {
  if (!studentIds || studentIds.length === 0) return { valid: false, students: [] }
  if (isSuperAdmin(userId)) return { valid: true, students: studentIds }

  const placeholders = studentIds.map(() => '?').join(',')
  const students = db.prepare(`
    SELECT s.id FROM students s
    JOIN classes c ON s.class_id = c.id
    WHERE s.id IN (${placeholders}) AND c.user_id = ?
  `).all(...studentIds, userId)

  return { valid: students.length === studentIds.length, students }
}

// ─── 中间件工厂 ────────────────────────────────────────────────────────

export function requireClassOwnership(req, res, next) {
  const classId = req.params.classId || req.body.classId
  if (!classId) return res.status(400).json({ error: '缺少班级ID' })
  const cls = verifyClassOwnership(classId, req.userId)
  if (!cls) return res.status(403).json({ error: '班级不存在或无权访问' })
  req.classInfo = cls
  next()
}

export function requireStudentOwnership(req, res, next) {
  const studentId = req.params.id
  if (!studentId) return res.status(400).json({ error: '缺少学生ID' })
  const student = verifyStudentOwnership(studentId, req.userId)
  if (!student) return res.status(404).json({ error: '学生不存在或无权访问' })
  req.studentInfo = student
  next()
}

/**
 * 只允许 teacher / super_admin 写操作的中间件
 */
export function requireAtLeastTeacher(req, res, next) {
  if (req.userRole === 'user') return res.status(403).json({ error: '权限不足，用户角色无法执行此操作' })
  next()
}

/**
 * 禁止 user 角色访问（所有 HTTP 方法）
 * 用于管理类路由：班级/学生/评价/规则/标签/管理后台等
 * user 角色只能使用 arena / ranking / pet-instances(读自己的) / invite
 */
export function requireNotUser(req, res, next) {
  if (req.userRole === 'user') {
    return res.status(403).json({ error: '权限不足，该功能仅对老师开放' })
  }
  next()
}
