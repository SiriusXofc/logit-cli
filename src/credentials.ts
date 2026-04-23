import type { LogitConfig } from './types'

export type SecretSource = 'config' | 'env' | 'missing'

export interface ResolvedSecret {
  value?: string
  source: SecretSource
}

function readEnv(names: string[]): ResolvedSecret {
  for (const name of names) {
    const value = process.env[name]?.trim()

    if (value) {
      return {
        value,
        source: 'env'
      }
    }
  }

  return {
    source: 'missing'
  }
}

export function resolveGroqKey(config: LogitConfig): ResolvedSecret {
  const envValue = readEnv(['GROQ_API_KEY'])

  if (envValue.value) {
    return envValue
  }

  if (config.groqKey) {
    return {
      value: config.groqKey,
      source: 'config'
    }
  }

  return {
    source: 'missing'
  }
}

export function resolveGitHubToken(config: LogitConfig): ResolvedSecret {
  const envValue = readEnv(['GITHUB_TOKEN', 'GH_TOKEN'])

  if (envValue.value) {
    return envValue
  }

  if (config.githubToken) {
    return {
      value: config.githubToken,
      source: 'config'
    }
  }

  return {
    source: 'missing'
  }
}
