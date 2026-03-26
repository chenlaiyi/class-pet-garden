import Database from 'better-sqlite3'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// 支持测试模式使用内存数据库
const dbPath = process.env.TEST_DB ? ':memory:' : join(__dirname, 'pet-garden.db')
export const db = new Database(dbPath)

// 初始化数据库表
export function initDb() {
  db.exec(`
    -- 用户表
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      is_guest INTEGER DEFAULT 0,
      created_at INTEGER
    );

    -- 班级表
    CREATE TABLE IF NOT EXISTS classes (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      name TEXT NOT NULL,
      created_at INTEGER,
      updated_at INTEGER
    );

    -- 学生表
    CREATE TABLE IF NOT EXISTS students (
      id TEXT PRIMARY KEY,
      class_id TEXT NOT NULL,
      name TEXT NOT NULL,
      student_no TEXT,
      total_points INTEGER DEFAULT 0,
      pet_type TEXT,
      pet_level INTEGER DEFAULT 1,
      pet_exp INTEGER DEFAULT 0,
      pet_status TEXT DEFAULT 'alive',
      created_at INTEGER,
      FOREIGN KEY (class_id) REFERENCES classes(id)
    );

    -- 徽章表
    CREATE TABLE IF NOT EXISTS badges (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      pet_type TEXT NOT NULL,
      earned_at INTEGER,
      FOREIGN KEY (student_id) REFERENCES students(id)
    );

    -- 评价规则表
    CREATE TABLE IF NOT EXISTS evaluation_rules (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      points INTEGER NOT NULL,
      category TEXT NOT NULL,
      is_custom INTEGER DEFAULT 0,
      created_at INTEGER
    );

    -- 评价记录表
    CREATE TABLE IF NOT EXISTS evaluation_records (
      id TEXT PRIMARY KEY,
      class_id TEXT NOT NULL,
      student_id TEXT NOT NULL,
      points INTEGER NOT NULL,
      reason TEXT NOT NULL,
      category TEXT NOT NULL,
      timestamp INTEGER,
      FOREIGN KEY (class_id) REFERENCES classes(id),
      FOREIGN KEY (student_id) REFERENCES students(id)
    );

    -- 学生标签表（用户隔离）
    CREATE TABLE IF NOT EXISTS student_tags (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      color TEXT DEFAULT '#6366f1',
      created_at INTEGER,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    -- 学生-标签关联表
    CREATE TABLE IF NOT EXISTS student_tag_relations (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      tag_id TEXT NOT NULL,
      created_at INTEGER,
      FOREIGN KEY (student_id) REFERENCES students(id),
      FOREIGN KEY (tag_id) REFERENCES student_tags(id)
    );

    -- 宠物实例表
    CREATE TABLE IF NOT EXISTS pet_instances (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      template_id TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL,
      display_name TEXT NOT NULL,
      student_id TEXT,
      class_id TEXT,
      level INTEGER DEFAULT 1,
      exp INTEGER DEFAULT 0,
      status TEXT DEFAULT 'alive',
      adopted_at INTEGER,
      created_at INTEGER,
      updated_at INTEGER,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (student_id) REFERENCES students(id),
      FOREIGN KEY (class_id) REFERENCES classes(id)
    );

    -- 宠物载体表（二维码/NFC）
    CREATE TABLE IF NOT EXISTS pet_carriers (
      id TEXT PRIMARY KEY,
      pet_instance_id TEXT NOT NULL,
      carrier_type TEXT NOT NULL,
      short_code TEXT UNIQUE,
      physical_uid TEXT,
      display_code TEXT,
      status TEXT DEFAULT 'active',
      activated_at INTEGER,
      created_at INTEGER,
      updated_at INTEGER,
      FOREIGN KEY (pet_instance_id) REFERENCES pet_instances(id)
    );
  `)

  // 迁移：添加 pet_status 字段（如果不存在）
  try {
    db.exec(`ALTER TABLE students ADD COLUMN pet_status TEXT DEFAULT 'alive'`)
  } catch (e) {
    // 字段已存在，忽略错误
  }

  // 迁移：添加 user_id 到 evaluation_rules（如果不存在）
  try {
    db.exec(`ALTER TABLE evaluation_rules ADD COLUMN user_id TEXT`)
  } catch (e) {
    // 字段已存在，忽略错误
  }

  // 迁移：添加 user_id 到 evaluation_records（如果不存在）
  try {
    db.exec(`ALTER TABLE evaluation_records ADD COLUMN user_id TEXT`)
  } catch (e) {
    // 字段已存在，忽略错误
  }

  // 迁移：添加 is_admin 到 users（如果不存在）
  try {
    db.exec(`ALTER TABLE users ADD COLUMN is_admin INTEGER DEFAULT 0`)
  } catch (e) {
    // 字段已存在，忽略错误
  }

  // 迁移：添加 pet_instance_id 到 students（如果不存在）
  try {
    db.exec(`ALTER TABLE students ADD COLUMN pet_instance_id TEXT`)
  } catch (e) {
    // 字段已存在，忽略错误
  }

  // 迁移：添加积分字段到 users（如果不存在）
  try {
    db.exec(`ALTER TABLE users ADD COLUMN points INTEGER DEFAULT 100`)
  } catch (e) {
    // 字段已存在，忽略错误
  }
  // 补充：已有用户 points 为 NULL 时设默认值 100
  try {
    db.exec(`UPDATE users SET points = 100 WHERE points IS NULL`)
  } catch (e) {
    // 忽略
  }

  // 迁移：创建竞技场积分记录表（如果不存在）
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS arena_records (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        pet_instance_id TEXT NOT NULL,
        zone_id INTEGER NOT NULL,
        result TEXT NOT NULL,
        points_change INTEGER NOT NULL,
        opponent_id TEXT,
        played_at INTEGER,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (pet_instance_id) REFERENCES pet_instances(id)
      )
    `)
  } catch (e) {
    // 表已存在，忽略错误
  }

  // 迁移：创建竞技场对战房间表（如果不存在）
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS arena_matches (
        id TEXT PRIMARY KEY,
        zone_id INTEGER NOT NULL,
        invite_code TEXT UNIQUE NOT NULL,
        p1_user_id TEXT NOT NULL,
        p1_pet_id TEXT,
        p1_pet_name TEXT,
        p1_pet_template TEXT,
        p1_pet_level INTEGER DEFAULT 1,
        p1_pet_code TEXT,
        p2_user_id TEXT,
        p2_pet_id TEXT,
        p2_pet_name TEXT,
        p2_pet_template TEXT,
        p2_pet_level INTEGER DEFAULT 1,
        p2_pet_code TEXT,
        p1_ready INTEGER DEFAULT 0,
        p2_ready INTEGER DEFAULT 0,
        p1_paid INTEGER DEFAULT 0,
        p2_paid INTEGER DEFAULT 0,
        status TEXT DEFAULT 'waiting',
        created_at INTEGER,
        updated_at INTEGER,
        FOREIGN KEY (p1_user_id) REFERENCES users(id),
        FOREIGN KEY (p2_user_id) REFERENCES users(id)
      )
    `)
  } catch (e) {
    // 表已存在，忽略错误
  }

  // 迁移：创建邀请码表（如果不存在）
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS invite_codes (
        id TEXT PRIMARY KEY,
        code TEXT UNIQUE NOT NULL,
        creator_user_id TEXT NOT NULL,
        used_by_user_id TEXT,
        used_at INTEGER,
        reward_given INTEGER DEFAULT 0,
        created_at INTEGER,
        FOREIGN KEY (creator_user_id) REFERENCES users(id),
        FOREIGN KEY (used_by_user_id) REFERENCES users(id)
      )
    `)
  } catch (e) {
    // 表已存在，忽略错误
  }

  // 迁移：添加 referred_by 到 users（如果不存在）
  try {
    db.exec(`ALTER TABLE users ADD COLUMN referred_by TEXT`)
  } catch (e) {
    // 字段已存在，忽略错误
  }
}
