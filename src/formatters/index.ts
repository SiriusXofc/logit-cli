import type { FormatDefinition, SupportedFormat } from '../types'
import { customFormatter } from './custom'
import { discordFormatter } from './discord'
import { emailFormatter } from './email'
import { jsonFormatter } from './json'
import { markdownFormatter } from './markdown'
import { releaseNotesFormatter } from './release-notes'
import { twitterFormatter } from './twitter'

export const formatters: Record<SupportedFormat, FormatDefinition> = {
  markdown: markdownFormatter,
  discord: discordFormatter,
  twitter: twitterFormatter,
  'release-notes': releaseNotesFormatter,
  email: emailFormatter,
  json: jsonFormatter,
  custom: customFormatter
}

export const formatChoices = [
  formatters.markdown,
  formatters.discord,
  formatters.twitter,
  formatters['release-notes'],
  formatters.email,
  formatters.json,
  formatters.custom
]

export function isSupportedFormat(format: string): format is SupportedFormat {
  return Object.prototype.hasOwnProperty.call(formatters, format)
}
