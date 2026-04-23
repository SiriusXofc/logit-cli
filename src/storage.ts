import path from 'node:path'
import os from 'node:os'
import Conf from 'conf'
import type { LogitConfig, SupportedFormat, SupportedLang } from './types'

const configRoot = path.join(os.homedir(), '.config', 'logit')

const store = new Conf<LogitConfig>({
  projectName: 'logit',
  cwd: configRoot,
  configName: 'config'
})

export function getConfig(): LogitConfig {
  return {
    groqKey: store.get('groqKey'),
    githubToken: store.get('githubToken'),
    lang: store.get('lang'),
    format: store.get('format'),
    customFormats: store.get('customFormats'),
    lastCustomPrompt: store.get('lastCustomPrompt')
  }
}

export function setConfigValue(key: 'groqKey', value: string): void
export function setConfigValue(key: 'githubToken', value: string): void
export function setConfigValue(key: 'lang', value: SupportedLang): void
export function setConfigValue(key: 'format', value: SupportedFormat): void
export function setConfigValue(
  key: 'groqKey' | 'githubToken' | 'lang' | 'format',
  value: string
): void {
  store.set(key, value)
}

export function resetConfig(): void {
  store.clear()
}

export function getCustomFormats(): Record<string, string> {
  return store.get('customFormats') ?? {}
}

export function getCustomFormat(name: string): string | undefined {
  return getCustomFormats()[name]
}

export function saveCustomFormat(name: string, prompt: string): void {
  const formats = getCustomFormats()
  store.set('customFormats', {
    ...formats,
    [name]: prompt
  })
}

export function deleteCustomFormat(name: string): boolean {
  const formats = getCustomFormats()
  if (!(name in formats)) {
    return false
  }

  const nextFormats = { ...formats }
  delete nextFormats[name]
  store.set('customFormats', nextFormats)
  return true
}

export function setLastCustomPrompt(prompt: string): void {
  store.set('lastCustomPrompt', prompt)
}

export function getLastCustomPrompt(): string | undefined {
  return store.get('lastCustomPrompt')
}

export function maskSecret(value: string | undefined): string {
  if (!value) {
    return 'not configured'
  }

  return 'configured'
}

export function getConfigPath(): string {
  return store.path
}
