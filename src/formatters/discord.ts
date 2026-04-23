import type { FormatDefinition } from '../types'

export const discordFormatter: FormatDefinition = {
  id: 'discord',
  label: '🎮 Discord         - Webhook-ready message',
  shortLabel: 'Discord Embed',
  description: 'Discord webhook-ready markdown',
  buildPrompt: (context) => `Generate Discord-friendly markdown for a release update.

Use this shape:
**📦 ${context.repo} — Update**
> Period: ${context.period}

✨ **Features**
• One concise change

🐛 **Fixes**
• One concise change

[View commits](https://github.com/${context.repo}/commits)

Keep it compact, readable, and ready to paste into Discord.`
}
