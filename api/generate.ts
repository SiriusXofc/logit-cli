import Groq from 'groq-sdk'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import type { CommitInfo, SupportedLang } from '../src/types'

interface GenerateRequestBody {
  commits?: unknown
  formatDescription?: unknown
  lang?: unknown
}

interface GroqErrorLike {
  status?: number
  message?: string
}

interface RateBucket {
  count: number
  resetAt: number
}

const MAX_COMMITS = 150
const MAX_FORMAT_DESCRIPTION_LENGTH = 6000
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000
const RATE_LIMIT_MAX_REQUESTS = 30
const buckets = new Map<string, RateBucket>()

function isGroqErrorLike(error: unknown): error is GroqErrorLike {
  return typeof error === 'object' && error !== null
}

function getClientIp(request: VercelRequest): string {
  const forwardedFor = request.headers['x-forwarded-for']

  if (typeof forwardedFor === 'string' && forwardedFor.length > 0) {
    return forwardedFor.split(',')[0]?.trim() ?? 'unknown'
  }

  return request.socket.remoteAddress ?? 'unknown'
}

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const bucket = buckets.get(ip)

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(ip, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS
    })
    return false
  }

  bucket.count += 1
  return bucket.count > RATE_LIMIT_MAX_REQUESTS
}

function isSupportedLang(value: unknown): value is SupportedLang {
  return value === 'pt-br' || value === 'en'
}

function sanitizeCommit(commit: unknown): CommitInfo | undefined {
  if (typeof commit !== 'object' || commit === null) {
    return undefined
  }

  const candidate = commit as Partial<Record<keyof CommitInfo, unknown>>

  if (typeof candidate.message !== 'string') {
    return undefined
  }

  return {
    sha: typeof candidate.sha === 'string' ? candidate.sha.slice(0, 80) : '',
    message: candidate.message.slice(0, 500),
    author: typeof candidate.author === 'string' ? candidate.author.slice(0, 120) : 'Unknown',
    date: typeof candidate.date === 'string' ? candidate.date.slice(0, 80) : '',
    url: typeof candidate.url === 'string' ? candidate.url.slice(0, 300) : ''
  }
}

function parseRequestBody(body: GenerateRequestBody): {
  commits: CommitInfo[]
  formatDescription: string
  lang: SupportedLang
} {
  if (!Array.isArray(body.commits)) {
    throw new Error('commits must be an array.')
  }

  if (typeof body.formatDescription !== 'string' || body.formatDescription.trim().length === 0) {
    throw new Error('formatDescription is required.')
  }

  if (body.formatDescription.length > MAX_FORMAT_DESCRIPTION_LENGTH) {
    throw new Error(`formatDescription must be ${MAX_FORMAT_DESCRIPTION_LENGTH} characters or less.`)
  }

  if (!isSupportedLang(body.lang)) {
    throw new Error('lang must be pt-br or en.')
  }

  const commits = body.commits.slice(0, MAX_COMMITS).map(sanitizeCommit).filter((commit): commit is CommitInfo => {
    return commit !== undefined
  })

  return {
    commits,
    formatDescription: body.formatDescription,
    lang: body.lang
  }
}

function formatCommitsForPrompt(commits: CommitInfo[]): string {
  return commits
    .map((commit) => {
      const date = commit.date ? commit.date.slice(0, 10) : 'unknown date'
      return `- ${date} | ${commit.author} | ${commit.message}`
    })
    .join('\n')
}

function buildPrompt(commits: CommitInfo[], lang: SupportedLang, formatDescription: string): string {
  return `Você é um assistente especializado em gerar changelogs profissionais.
Analise os commits abaixo e gere um changelog no formato solicitado.

Regras:
- Agrupe por tipo: ✨ Features, 🐛 Fixes, 💥 Breaking Changes, 🔧 Improvements, 📚 Docs
- Ignore commits triviais (merge, typo, wip, bump version)
- Escreva de forma clara e objetiva no idioma: ${lang}
- Não inclua hashes de commit
- Máximo de 1 frase por item

Commits:
${formatCommitsForPrompt(commits)}

Formato desejado: ${formatDescription}`
}

function getGroqKeys(): string[] {
  return [process.env.GROQ_API_KEY, process.env.GROQ_API_KEY_FALLBACK].filter((key): key is string => {
    return typeof key === 'string' && key.trim().length > 0
  })
}

async function generateWithGroq(
  apiKey: string,
  commits: CommitInfo[],
  lang: SupportedLang,
  formatDescription: string
): Promise<string> {
  const client = new Groq({
    apiKey
  })

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
        content: buildPrompt(commits, lang, formatDescription)
      }
    ]
  })

  const content = completion.choices[0]?.message?.content?.trim()

  if (!content) {
    throw new Error('Groq returned an empty changelog.')
  }

  return content
}

function shouldTryFallback(error: unknown): boolean {
  if (!isGroqErrorLike(error)) {
    return false
  }

  return error.status === 429 || (typeof error.status === 'number' && error.status >= 500)
}

export default async function handler(request: VercelRequest, response: VercelResponse): Promise<void> {
  response.setHeader('Cache-Control', 'no-store')

  if (request.method === 'OPTIONS') {
    response.status(204).end()
    return
  }

  if (request.method !== 'POST') {
    response.status(405).json({ error: 'Method not allowed.' })
    return
  }

  const ip = getClientIp(request)

  if (isRateLimited(ip)) {
    response.status(429).json({ error: 'Rate limit reached. Try again later or configure your own Groq key locally.' })
    return
  }

  const keys = getGroqKeys()

  if (keys.length === 0) {
    response.status(500).json({ error: 'Logit API is not configured.' })
    return
  }

  try {
    const body = parseRequestBody(request.body as GenerateRequestBody)
    let lastError: unknown

    for (const key of keys) {
      try {
        const changelog = await generateWithGroq(key, body.commits, body.lang, body.formatDescription)
        response.status(200).json({ changelog })
        return
      } catch (error) {
        lastError = error

        if (!shouldTryFallback(error)) {
          break
        }
      }
    }

    if (isGroqErrorLike(lastError) && lastError.status === 401) {
      response.status(502).json({ error: 'AI provider authentication failed.' })
      return
    }

    if (isGroqErrorLike(lastError) && lastError.status === 429) {
      response.status(429).json({ error: 'AI provider rate limit reached. Try again later or configure your own Groq key locally.' })
      return
    }

    response.status(502).json({ error: 'AI provider request failed.' })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid request.'
    response.status(400).json({ error: message })
  }
}
