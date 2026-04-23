import { execSync } from 'node:child_process'
import inquirer from 'inquirer'
import type { RepoInfo } from './types'

interface RepoPromptAnswer {
  repo: string
}

export function parseGitHubRemote(remoteUrl: string): RepoInfo | undefined {
  const trimmed = remoteUrl.trim()
  const httpsMatch = trimmed.match(/^https:\/\/github\.com\/([^/\s]+)\/([^/\s]+?)(?:\.git)?\/?$/i)
  const sshMatch = trimmed.match(/^git@github\.com:([^/\s]+)\/([^/\s]+?)(?:\.git)?$/i)
  const sshProtocolMatch = trimmed.match(/^ssh:\/\/git@github\.com\/([^/\s]+)\/([^/\s]+?)(?:\.git)?$/i)
  const match = httpsMatch ?? sshMatch ?? sshProtocolMatch

  if (!match) {
    return undefined
  }

  const owner = match[1]
  const repo = match[2]

  return {
    owner,
    repo,
    fullName: `${owner}/${repo}`
  }
}

export function parseRepoInput(input: string): RepoInfo | undefined {
  const trimmed = input.trim()
  const remote = parseGitHubRemote(trimmed)

  if (remote) {
    return remote
  }

  const shorthand = trimmed.match(/^([^/\s]+)\/([^/\s]+)$/)

  if (!shorthand) {
    return undefined
  }

  const owner = shorthand[1]
  const repo = shorthand[2].replace(/\.git$/i, '')

  return {
    owner,
    repo,
    fullName: `${owner}/${repo}`
  }
}

export function detectGitHubRepo(): RepoInfo | undefined {
  try {
    const remoteUrl = execSync('git remote get-url origin', {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore']
    })
    const repo = parseGitHubRemote(remoteUrl)

    if (!repo) {
      return undefined
    }

    return {
      ...repo,
      branch: detectCurrentBranch()
    }
  } catch {
    return undefined
  }
}

export function detectCurrentBranch(): string | undefined {
  try {
    const branch = execSync('git rev-parse --abbrev-ref HEAD', {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore']
    }).trim()

    return branch.length > 0 ? branch : undefined
  } catch {
    return undefined
  }
}

export async function promptForRepo(defaultRepo?: string): Promise<RepoInfo> {
  const answer = await inquirer.prompt<RepoPromptAnswer>([
    {
      type: 'input',
      name: 'repo',
      message: 'Which repository?',
      default: defaultRepo,
      validate: (value: string) => {
        return parseRepoInput(value)
          ? true
          : 'Use owner/repo, https://github.com/owner/repo.git, or git@github.com:owner/repo.git'
      }
    }
  ])

  const repo = parseRepoInput(answer.repo)

  if (!repo) {
    throw new Error('Invalid repository. Use owner/repo.')
  }

  return {
    ...repo,
    branch: detectCurrentBranch()
  }
}
