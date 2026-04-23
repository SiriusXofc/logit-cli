import type { FormatDefinition } from '../types'

export const twitterFormatter: FormatDefinition = {
  id: 'twitter',
  label: '🐦 Twitter/X       - Short thread',
  shortLabel: 'Twitter/X Thread',
  description: 'Short Twitter/X thread',
  buildPrompt: (context) => `Generate a concise Twitter/X thread for ${context.repo}.

Rules:
- Start with a short announcement.
- Number each change as a thread item.
- Keep each post under 260 characters.
- End each post with a thread counter like [1/2].
- Do not include commit hashes.`
}
