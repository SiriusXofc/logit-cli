import type { FormatDefinition } from '../types'

export const jsonFormatter: FormatDefinition = {
  id: 'json',
  label: '🔷 JSON            - Structured output',
  shortLabel: 'JSON',
  description: 'Structured JSON changelog',
  buildPrompt: (context) => `Generate valid JSON only. Do not wrap it in Markdown.

Use this schema:
{
  "version": "unreleased",
  "date": "${context.generatedAt}",
  "repo": "${context.repo}",
  "period": "${context.period}",
  "changes": {
    "features": [],
    "fixes": [],
    "breaking": [],
    "improvements": [],
    "docs": []
  }
}`
}
