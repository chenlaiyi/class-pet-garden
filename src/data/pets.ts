// 宠物类型定义
export interface PetType {
  id: string
  name: string
  category: 'normal' | 'mythical'
  image: string
  rarity: 'common' | 'rare' | 'epic'
  personality: string[]
  description: string
  placeholder: string
  color: string
  // 等级图片路径，key为等级(1-8)，value为图片路径
  levelImages?: Record<number, string>
}

// 生成等级图片路径的辅助函数
function generateLevelImages(petId: string): Record<number, string> {
  const basePath = `/pets/${petId}`
  const images: Record<number, string> = {}
  for (let i = 1; i <= 8; i++) {
    images[i] = `${basePath}/lv${i}.png`
  }
  return images
}

// 获取默认图片（等级1）
function getDefaultImage(petId: string): string {
  return `/pets/${petId}/lv1.png`
}

// 宠物配置（小学生友好版首批 12 只）
export const PET_TYPES: PetType[] = [
  {
    id: 'shiba',
    name: '柴柴',
    category: 'normal',
    image: getDefaultImage('shiba'),
    levelImages: generateLevelImages('shiba'),
    rarity: 'common',
    personality: ['勇敢', '活力', '热血'],
    description: '总是精神满满，最喜欢和你一起进步！',
    placeholder: '🐕',
    color: 'from-orange-300 to-amber-400'
  },
  {
    id: 'corgi',
    name: '柯基',
    category: 'normal',
    image: getDefaultImage('corgi'),
    levelImages: generateLevelImages('corgi'),
    rarity: 'common',
    personality: ['快乐', '搞笑', '亲近'],
    description: '短短的小腿跑得飞快，是班里的开心果。',
    placeholder: '🐶',
    color: 'from-yellow-300 to-orange-300'
  },
  {
    id: 'golden',
    name: '金毛',
    category: 'normal',
    image: getDefaultImage('golden'),
    levelImages: generateLevelImages('golden'),
    rarity: 'rare',
    personality: ['温柔', '可靠', '守护'],
    description: '像阳光一样温暖，总会陪在你身边。',
    placeholder: '🦮',
    color: 'from-amber-200 to-yellow-400'
  },
  {
    id: 'bichon',
    name: '比熊',
    category: 'normal',
    image: getDefaultImage('bichon'),
    levelImages: generateLevelImages('bichon'),
    rarity: 'rare',
    personality: ['甜甜', '治愈', '软萌'],
    description: '像棉花糖一样蓬松，见到它心情都会变好。',
    placeholder: '🐩',
    color: 'from-slate-100 to-pink-100'
  },
  {
    id: 'orange-cat',
    name: '橘猫',
    category: 'normal',
    image: getDefaultImage('orange-cat'),
    levelImages: generateLevelImages('orange-cat'),
    rarity: 'common',
    personality: ['可爱', '放松', '亲近'],
    description: '最爱晒太阳，也最爱吃小零食，是个超级治愈的小伙伴。',
    placeholder: '🐈',
    color: 'from-orange-200 to-orange-400'
  },
  {
    id: 'ragdoll',
    name: '布偶猫',
    category: 'normal',
    image: getDefaultImage('ragdoll'),
    levelImages: generateLevelImages('ragdoll'),
    rarity: 'rare',
    personality: ['温柔', '梦幻', '优雅'],
    description: '有一双像天空一样的眼睛，安静又温柔。',
    placeholder: '🐱',
    color: 'from-blue-100 to-indigo-200'
  },
  {
    id: 'bunny',
    name: '小白兔',
    category: 'normal',
    image: getDefaultImage('bunny'),
    levelImages: generateLevelImages('bunny'),
    rarity: 'rare',
    personality: ['乖巧', '认真', '文静'],
    description: '轻轻跳来跳去，是认真努力的小榜样。',
    placeholder: '🐰',
    color: 'from-pink-100 to-rose-200'
  },
  {
    id: 'hamster',
    name: '仓鼠球球',
    category: 'normal',
    image: getDefaultImage('hamster'),
    levelImages: generateLevelImages('hamster'),
    rarity: 'common',
    personality: ['机灵', '聪明', '灵活'],
    description: '鼓鼓的小脸蛋里，好像装着一整个小宝藏。',
    placeholder: '🐹',
    color: 'from-amber-100 to-orange-200'
  },
  {
    id: 'duckling',
    name: '小黄鸭',
    category: 'normal',
    image: getDefaultImage('duckling'),
    levelImages: generateLevelImages('duckling'),
    rarity: 'common',
    personality: ['阳光', '快乐', '社交'],
    description: '走到哪里都像带着小太阳，最会活跃气氛。',
    placeholder: '🐥',
    color: 'from-yellow-200 to-amber-300'
  },
  {
    id: 'alpaca',
    name: '羊驼',
    category: 'normal',
    image: getDefaultImage('alpaca'),
    levelImages: generateLevelImages('alpaca'),
    rarity: 'rare',
    personality: ['冷静', '呆萌', '特别'],
    description: '看起来慢悠悠，其实是个很有自己想法的小伙伴。',
    placeholder: '🦙',
    color: 'from-stone-200 to-orange-200'
  },
  {
    id: 'unicorn',
    name: '独角兽',
    category: 'mythical',
    image: getDefaultImage('unicorn'),
    levelImages: generateLevelImages('unicorn'),
    rarity: 'epic',
    personality: ['梦幻', '幸运', '闪亮'],
    description: '传说中会带来好运和闪闪发光的梦想。',
    placeholder: '🦄',
    color: 'from-pink-200 via-purple-200 to-cyan-200'
  },
  {
    id: 'baby-dragon',
    name: '小龙',
    category: 'mythical',
    image: getDefaultImage('baby-dragon'),
    levelImages: generateLevelImages('baby-dragon'),
    rarity: 'epic',
    personality: ['勇气', '成长', '探索'],
    description: '虽然现在还小，但它的心里装着大大的冒险世界。',
    placeholder: '🐉',
    color: 'from-emerald-200 to-cyan-300'
  },
  {
    id: 'mecha',
    name: '机甲战士',
    category: 'normal',
    image: '', // CSS 绘制，无需图片
    levelImages: {}, // CSS 绘制，无需图片
    rarity: 'epic',
    personality: ['金属', '能量', '守护'],
    description: '来自未来的机甲守护者，橙色的核心驱动着它的心跳。',
    placeholder: '🤖',
    color: 'from-gray-300 to-orange-400'
  }
]

// 等级配置
export const LEVEL_CONFIG = [40, 60, 80, 100, 120, 140, 160]

// 获取宠物信息
export function getPetType(id: string): PetType | undefined {
  return PET_TYPES.find(p => p.id === id)
}

// 获取宠物指定等级的图片
export function getPetLevelImage(petId: string, level: number): string {
  const pet = getPetType(petId)
  if (!pet) return ''

  const validLevel = Math.max(1, Math.min(8, level))
  return pet.levelImages?.[validLevel] || pet.image || ''
}

// 死亡阈值
export const DEATH_THRESHOLD = -20

// 检查宠物状态（前端判断用，与后端逻辑一致）
export function checkPetStatus(totalPoints: number, currentStatus?: string | null): 'alive' | 'injured' | 'dead' {
  const status = currentStatus || 'alive'

  if (totalPoints < DEATH_THRESHOLD) {
    return 'dead'
  }

  if (totalPoints < 0) {
    if (status === 'dead') {
      return 'dead'
    }
    return 'injured'
  }

  return 'alive'
}

// 获取宠物等级1的图片（用于选择列表展示）
export function getPetLevel1Image(petId: string): string {
  return getPetLevelImage(petId, 1)
}

// 计算等级
export function calculateLevel(exp: number): number {
  let level = 1
  let total = 0
  for (const required of LEVEL_CONFIG) {
    total += required
    if (exp >= total) {
      level++
    } else {
      break
    }
  }
  return Math.min(level, 8)
}

// 获取当前等级进度
export function getLevelProgress(exp: number): { current: number; required: number; percentage: number; isMaxLevel: boolean } {
  if (!exp || exp <= 0) {
    return { current: 0, required: LEVEL_CONFIG[0], percentage: 0, isMaxLevel: false }
  }

  let total = 0
  for (let i = 0; i < LEVEL_CONFIG.length; i++) {
    const levelTotal = total + LEVEL_CONFIG[i]
    if (exp < levelTotal) {
      const current = exp - total
      return {
        current,
        required: LEVEL_CONFIG[i],
        percentage: Math.round((current / LEVEL_CONFIG[i]) * 100),
        isMaxLevel: false
      }
    }
    total = levelTotal
  }

  const maxExp = LEVEL_CONFIG.reduce((sum, req) => sum + req, 0)
  return {
    current: exp,
    required: maxExp,
    percentage: 100,
    isMaxLevel: true
  }
}
