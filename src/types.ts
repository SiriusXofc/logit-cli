export type SupportedFormat =
  | 'markdown'
  | 'discord'
  | 'twitter'
  | 'release-notes'
  | 'email'
  | 'json'
  | 'custom'

export type SupportedLang = 'pt-br' | 'en'

export interface CommitInfo {
  sha: string
  message: string
  author: string
  date: string
  url: string
}

export interface RepoInfo {
  owner: string
  repo: string
  fullName: string
  branch?: string
}

export interface Period {
  since?: string
  until?: string
  label: string
}

export interface FormatterContext {
  commits: CommitInfo[]
  lang: SupportedLang
  repo: string
  period: string
  generatedAt: string
  customPrompt?: string
}

export interface FormatDefinition {
  id: SupportedFormat
  label: string
  shortLabel: string
  description: string
  buildPrompt: (context: FormatterContext) => string
}

export interface LogitConfig extends Record<string, unknown> {
  groqKey?: string
  githubToken?: string
  lang?: SupportedLang
  format?: SupportedFormat
  customFormats?: Record<string, string>
  lastCustomPrompt?: string
}
