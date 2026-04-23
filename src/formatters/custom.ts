import type { FormatDefinition } from '../types'

export const customFormatter: FormatDefinition = {
  id: 'custom',
  label: '✏️  Other           - Describe what you want',
  shortLabel: 'Custom',
  description: 'User-described custom format',
  buildPrompt: (context) => context.customPrompt ?? 'Generate a professional changelog in a custom format.'
}
