/**
 * 扫码解析 composable
 * 解析宠物身份码 / 邀请码 / arena 链接
 */

import { ref } from 'vue'

export type ScanResult = {
  type: 'pet_code' | 'invite_code' | 'arena_url' | 'unknown'
  value: string
}

function parseScannedText(raw: string): ScanResult {
  const t = raw.trim()

  // arena join URL → 提取6位邀请码
  const arenaMatch = t.match(/pet\.tapgo\.cn\/join\/([0-9]{6})/)
  if (arenaMatch) return { type: 'invite_code', value: arenaMatch[1] }

  // 纯6位数字邀请码
  if (/^[0-9]{6}$/.test(t)) return { type: 'invite_code', value: t }

  // 宠物身份页 URL
  const petMatch = t.match(/pet\.tapgo\.cn\/p\/([A-Za-z0-9]+)/)
  if (petMatch) return { type: 'pet_code', value: petMatch[1] }

  // DCI 格式
  const dciMatch = t.match(/DCI[:\/]([A-Za-z0-9]+)/i)
  if (dciMatch) return { type: 'pet_code', value: dciMatch[1] }

  return { type: 'unknown', value: t }
}

export function useQrScan() {
  const error = ref('')

  /** 解析任意字符串（手动输入 / clipboard 结果） */
  function parse(raw: string): ScanResult {
    error.value = ''
    return parseScannedText(raw)
  }

  return { error, parse }
}
