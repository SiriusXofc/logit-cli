import type { CommitInfo, SupportedLang } from '../types'

export const DEFAULT_LOGIT_API_URL = 'https://logit-cli.vercel.app/api/generate'

interface GenerateWithLogitApiOptions {
  apiUrl?: string
  commits: CommitInfo[]
  formatDescription: string
  lang: SupportedLang
}

interface LogitApiSuccess {
  changelog: string
}

interface LogitApiError {
  error?: string
}

function isLogitApiSuccess(value: unknown): value is LogitApiSuccess {
  return (
    typeof value === 'object' &&
    value !== null &&
    'changelog' in value &&
    typeof (value as { changelog?: unknown }).changelog === 'string'
  )
}

function isLogitApiError(value: unknown): value is LogitApiError {
  return (
    typeof value === 'object' &&
    value !== null &&
    'error' in value &&
    typeof (value as { error?: unknown }).error === 'string'
  )
}

export function getLogitApiUrl(): string {
  return process.env.LOGIT_API_URL?.trim() || DEFAULT_LOGIT_API_URL
}

export async function generateChangelogWithLogitApi(options: GenerateWithLogitApiOptions): Promise<string> {
  const apiUrl = options.apiUrl ?? getLogitApiUrl()
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'user-agent': 'logit-cli/1.0.0',
      'x-logit-client': 'logit-cli'
    },
    body: JSON.stringify({
      commits: options.commits,
      formatDescription: options.formatDescription,
      lang: options.lang
    })
  })

  const payload: unknown = await response.json().catch(() => undefined)

  if (!response.ok) {
    const message = isLogitApiError(payload) ? payload.error : `Logit API returned HTTP ${response.status}.`
    throw new Error(`${message} You can also configure your own Groq key with: logit config setup`)
  }

  if (!isLogitApiSuccess(payload) || payload.changelog.trim().length === 0) {
    throw new Error('Logit API returned an empty changelog.')
  }

  return payload.changelog.trim()
}
