import { getPetType } from '@/data/pets'

export interface DemoPetInstance {
  code: string
  templateId: string
  displayName: string
  ownerName: string
  className: string
  level: number
  exp: number
  status: 'alive' | 'injured' | 'dead'
  adoptedAt: string
  arenaTitle: string
  motto: string
}

export const DEMO_PET_INSTANCES: DemoPetInstance[] = [
  {
    code: 'demo-shiba-001',
    templateId: 'shiba',
    displayName: '火花柴柴',
    ownerName: '小意同学',
    className: '向日葵一班',
    level: 5,
    exp: 286,
    status: 'alive',
    adoptedAt: '2026-03-18',
    arenaTitle: '敏捷先锋',
    motto: '今天也要元气满满地闯关！'
  },
  {
    code: 'demo-corgi-001',
    templateId: 'corgi',
    displayName: '奶糖柯基',
    ownerName: '小果同学',
    className: '彩虹二班',
    level: 4,
    exp: 188,
    status: 'alive',
    adoptedAt: '2026-03-19',
    arenaTitle: '快乐应援官',
    motto: '短腿也能跑出大大的冠军梦。'
  },
  {
    code: 'demo-unicorn-001',
    templateId: 'unicorn',
    displayName: '彩虹独角兽',
    ownerName: '小晴同学',
    className: '星星三班',
    level: 7,
    exp: 565,
    status: 'alive',
    adoptedAt: '2026-03-16',
    arenaTitle: '梦幻守护者',
    motto: '把好运和勇气都送给你。'
  },
  {
    code: 'demo-baby-dragon-001',
    templateId: 'baby-dragon',
    displayName: '薄荷小龙',
    ownerName: '小宇同学',
    className: '探险四班',
    level: 6,
    exp: 438,
    status: 'injured',
    adoptedAt: '2026-03-17',
    arenaTitle: '竞技场挑战者',
    motto: '受点伤也没关系，我会继续变强。'
  }
]

export function getDemoPetByCode(code: string) {
  return DEMO_PET_INSTANCES.find(item => item.code === code)
}

export function getDemoPetDetail(code: string) {
  const instance = getDemoPetByCode(code)
  if (!instance) return null
  const template = getPetType(instance.templateId)
  if (!template) return null
  return { ...instance, template }
}
