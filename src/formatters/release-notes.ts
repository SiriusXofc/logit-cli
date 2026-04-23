import type { FormatDefinition } from '../types'

export const releaseNotesFormatter: FormatDefinition = {
  id: 'release-notes',
  label: '📦 Release Notes   - GitHub Releases',
  shortLabel: 'Release Notes',
  description: 'GitHub Release Notes markdown',
  buildPrompt: () => `Generate GitHub Release Notes in clean Markdown.

Use restrained headings, professional wording, and no excessive emoji.
Group changes into:
- Highlights
- Fixes
- Improvements
- Documentation
- Breaking Changes, only when present`
}
