export type PetAnimationMode = 'idle' | 'tap' | 'entrance' | 'emotion'

export interface PetAnimationSpec {
  enabled: boolean
  engine: 'css-image-rig' | 'sequence' | 'spine' | 'live2d' | 'video'
  defaultMode: PetAnimationMode
  supportedModes: PetAnimationMode[]
  qualityTarget: 'prototype' | 'production'
  notes?: string
  assets?: Partial<Record<PetAnimationMode, string>>
}

export const PET_ANIMATION_SPECS: Record<string, PetAnimationSpec> = {
  shiba: {
    enabled: true,
    engine: 'css-image-rig',
    defaultMode: 'idle',
    supportedModes: ['idle', 'tap', 'entrance', 'emotion'],
    qualityTarget: 'prototype',
    notes: '当前为前端结构化动效骨架；后续替换为正式角色动画资产。'
  },
  corgi: {
    enabled: true,
    engine: 'css-image-rig',
    defaultMode: 'idle',
    supportedModes: ['idle', 'tap', 'entrance', 'emotion'],
    qualityTarget: 'prototype'
  },
  golden: {
    enabled: true,
    engine: 'css-image-rig',
    defaultMode: 'idle',
    supportedModes: ['idle', 'tap'],
    qualityTarget: 'prototype'
  },
  bichon: {
    enabled: true,
    engine: 'css-image-rig',
    defaultMode: 'idle',
    supportedModes: ['idle', 'tap'],
    qualityTarget: 'prototype'
  }
}

export function getPetAnimationSpec(petId: string): PetAnimationSpec | null {
  return PET_ANIMATION_SPECS[petId] || null
}

export function hasPetAnimation(petId: string, mode?: PetAnimationMode): boolean {
  const spec = getPetAnimationSpec(petId)
  if (!spec?.enabled) return false
  if (!mode) return true
  return spec.supportedModes.includes(mode)
}
