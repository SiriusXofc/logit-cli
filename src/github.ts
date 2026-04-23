import { Octokit } from '@octokit/rest'
import type { CommitInfo } from './types'

interface FetchCommitsOptions {
  owner: string
  repo: string
  since?: string
  until?: string
  token?: string
}

interface LatestReleaseOptions {
  owner: string
  repo: string
  token?: string
}

interface RequestErrorLike {
  status?: number
  message?: string
  response?: {
    headers?: Record<string, string | undefined>
  }
}

function createOctokit(token?: string): Octokit {
  return new Octokit(token ? { auth: token } : {})
}

function isRequestErrorLike(error: unknown): error is RequestErrorLike {
  return typeof error === 'object' && error !== null
}

export function normalizeGitHubError(error: unknown): Error {
  if (!isRequestErrorLike(error)) {
    return new Error('GitHub request failed. Please try again.')
  }

  if (error.status === 404) {
    return new Error(
      'Repository not found. Check the repo name, or configure a GitHub token if it is private: logit config set github-token <token>'
    )
  }

  if (error.status === 403) {
    const reset = error.response?.headers?.['x-ratelimit-reset']
    const resetHint = reset ? ` Rate limit resets at ${new Date(Number(reset) * 1000).toLocaleString()}.` : ''
    return new Error(
      `GitHub rate limit reached. Configure a token with: logit config set github-token <token>.${resetHint}`
    )
  }

  return new Error(error.message ?? 'GitHub request failed. Please try again.')
}

export async function fetchCommits(options: FetchCommitsOptions): Promise<CommitInfo[]> {
  const octokit = createOctokit(options.token)
  const commits: CommitInfo[] = []
  let page = 1

  try {
    while (true) {
      const response = await octokit.repos.listCommits({
        owner: options.owner,
        repo: options.repo,
        since: options.since,
        until: options.until,
        per_page: 100,
        page
      })

      for (const item of response.data) {
        commits.push({
          sha: item.sha,
          message: item.commit.message.split('\n')[0] ?? item.commit.message,
          author: item.commit.author?.name ?? item.author?.login ?? 'Unknown',
          date: item.commit.author?.date ?? item.commit.committer?.date ?? '',
          url: item.html_url
        })
      }

      if (response.data.length < 100) {
        break
      }

      page += 1
    }

    return commits
  } catch (error) {
    throw normalizeGitHubError(error)
  }
}

export async function fetchLatestReleaseOrTagDate(options: LatestReleaseOptions): Promise<string | undefined> {
  const octokit = createOctokit(options.token)

  try {
    const latestRelease = await octokit.repos.getLatestRelease({
      owner: options.owner,
      repo: options.repo
    })

    return latestRelease.data.published_at ?? latestRelease.data.created_at
  } catch (error) {
    if (!isRequestErrorLike(error) || error.status !== 404) {
      throw normalizeGitHubError(error)
    }
  }

  try {
    const tags = await octokit.repos.listTags({
      owner: options.owner,
      repo: options.repo,
      per_page: 1
    })

    const latestTag = tags.data[0]

    if (!latestTag) {
      return undefined
    }

    const tagCommits = await octokit.repos.listCommits({
      owner: options.owner,
      repo: options.repo,
      sha: latestTag.name,
      per_page: 1
    })

    return tagCommits.data[0]?.commit.author?.date ?? tagCommits.data[0]?.commit.committer?.date
  } catch (error) {
    throw normalizeGitHubError(error)
  }
}
