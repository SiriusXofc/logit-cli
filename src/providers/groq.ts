import Groq from 'groq-sdk'
import type { CommitInfo, SupportedLang } from '../types'

interface GenerateChangelogOptions {
  apiKey: string
  commits: CommitInfo[]
  formatDescription: string
  lang: SupportedLang
}

interface GroqErrorLike {
  status?: number
  message?: string
  headers?: Record<string, string | undefined>
  error?: {
    message?: string
  }
}

function isGroqErrorLike(error: unknown): error is GroqErrorLike {
  return typeof error === 'object' && error !== null
}

function formatCommitsForPrompt(commits: CommitInfo[]): string {
  return commits
    .map((commit) => {
      const date = commit.date ? commit.date.slice(0, 10) : 'unknown date'
      return `- ${date} | ${commit.author} | ${commit.message}`
    })
    .join('\n')
}

export function normalizeGroqError(error: unknown): Error {
  if (!isGroqErrorLike(error)) {
    return new Error('Groq request failed. Please try again.')
  }

  if (error.status === 401) {
    return new Error('Groq authentication failed. Check your key with: logit config setup, logit config set groq-key <key>, or GROQ_API_KEY=<key>.')
  }

  if (error.status === 429) {
    const retryAfter = error.headers?.['retry-after']
    const retryHint = retryAfter ? ` Try again in ${retryAfter} seconds.` : ' Try again in a moment.'
    return new Error(`Groq rate limit reached.${retryHint}`)
  }

  return new Error(error.error?.message ?? error.message ?? 'Groq request failed. Please try again.')
}

export async function generateChangelogWithGroq(options: GenerateChangelogOptions): Promise<string> {
  const client = new Groq({
    apiKey: options.apiKey
  })

  const prompt = `Você é um assistente especializado em gerar changelogs profissionais.
Analise os commits abaixo e gere um changelog no formato solicitado.

Regras:
- Agrupe por tipo: ✨ Features, 🐛 Fixes, 💥 Breaking Changes, 🔧 Improvements, 📚 Docs
- Ignore commits triviais (merge, typo, wip, bump version)
- Escreva de forma clara e objetiva no idioma: ${options.lang}
- Não inclua hashes de commit
- Máximo de 1 frase por item

Commits:
${formatCommitsForPrompt(options.commits)}

Formato desejado: ${options.formatDescription}`

  try {
    const completion = await client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      temperature: 0.35,
      messages: [
        {
          role: 'system',
          content: 'You generate professional changelogs from git commit history. Follow the requested output format exactly.'
        },
        {
          role: 'user',
          content: prompt
        }
      ]
    })

    const content = completion.choices[0]?.message?.content?.trim()

    if (!content) {
      throw new Error('Groq returned an empty changelog.')
    }

    return content
  } catch (error) {
    throw normalizeGroqError(error)
  }
}
