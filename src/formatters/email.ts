import type { FormatDefinition } from '../types'

export const emailFormatter: FormatDefinition = {
  id: 'email',
  label: '📧 Email           - Newsletter update',
  shortLabel: 'Email',
  description: 'Simple HTML newsletter',
  buildPrompt: (context) => `Generate a simple HTML newsletter update for ${context.repo}.

Return only valid HTML suitable for an email body. Use:
- <h1> for the title
- <p> for a short intro
- <h2> for grouped sections
- <ul><li> for changes

Keep CSS inline-free and simple.`
}
