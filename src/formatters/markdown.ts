import type { FormatDefinition } from '../types'

export const markdownFormatter: FormatDefinition = {
  id: 'markdown',
  label: '📄 Markdown        - Standard CHANGELOG.md',
  shortLabel: 'Markdown',
  description: 'Standard CHANGELOG.md',
  buildPrompt: (context) => `Generate a standard CHANGELOG.md section.

Required structure:
## [Unreleased] — ${context.generatedAt}

### ✨ Features
- One concise change

### 🐛 Fixes
- One concise change

Include only sections that have relevant changes. Use clean Markdown.`
}
