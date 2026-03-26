/**
 * Web NFC 写入 hook
 * 仅支持 NFC Forum NDEF 文本记录，写入格式：pet.tapgo.cn/p/{code}
 */

import { ref } from 'vue'

export interface NfcWriteResult {
  success: boolean
  message: string
}

export function useNfcWrite() {
  const isWriting = ref(false)
  const lastResult = ref<NfcWriteResult | null>(null)

  /** 检测浏览器是否支持 Web NFC */
  function isSupported(): boolean {
    return typeof window !== 'undefined' && 'NDEFReader' in window
  }

  /**
   * 将宠物码写入 NFC 标签（默认写宠物身份页）
   * @param petCode 宠物编号，如 "ABC123"
   * @returns 写入结果
   */
  async function writePetCode(petCode: string): Promise<NfcWriteResult> {
    return writeUrl(`https://pet.tapgo.cn/p/${petCode}`, `宠物「${petCode}」的入口`)
  }

  /**
   * 将自定义 URL 写入 NFC 标签
   * @param url 完整 URL，如 https://pet.tapgo.cn/join/123456
   * @param label 成功提示中的描述，如 "对战入场"
   */
  async function writeUrl(url: string, label?: string): Promise<NfcWriteResult> {
    lastResult.value = null

    if (!isSupported()) {
      const result = { success: false, message: '您的浏览器不支持 Web NFC，请使用 Chrome/Edge 安卓版或 Safari iOS 18+' }
      lastResult.value = result
      return result
    }

    if (isWriting.value) {
      const result = { success: false, message: '正在写入中，请稍候…' }
      lastResult.value = result
      return result
    }

    isWriting.value = true

    try {
      const ndef = new (window as any).NDEFReader()

      await ndef.write(
        [
          new (window as any).NDEFRecord({
            recordType: 'text',
            data: url
          }),
          new (window as any).NDEFRecord({
            recordType: 'url',
            data: url
          })
        ],
        { overwrite: true }
      )

      const result = { success: true, message: `写入成功！NFC 标签已保存${label || '入口链接'}` }
      lastResult.value = result
      return result
    } catch (err: any) {
      let message = '写入失败'
      if (err.name === 'NotAllowedError') {
        message = '需要 NFC 权限，请在弹窗中允许访问'
      } else if (err.name === 'NotSupportedError') {
        message = 'NFC 不可用，请确认设备支持 NFC 并已开启'
      } else if (err.message?.includes('Invalid record')) {
        message = 'NFC 标签不支持此格式，请使用 NDEF 可写的 NFC 标签'
      } else {
        message = `写入失败：${err.message || String(err)}`
      }
      const result = { success: false, message }
      lastResult.value = result
      return result
    } finally {
      isWriting.value = false
    }
  }

  return { isWriting, lastResult, isSupported, writePetCode, writeUrl }
}
