import fs from 'node:fs/promises'
import path from 'node:path'
import chalk from 'chalk'
import clipboardy from 'clipboardy'
import { Command } from 'commander'
import inquirer from 'inquirer'
import ora from 'ora'
import { resolveGitHubToken, resolveGroqKey } from '../credentials'
import { detectGitHubRepo, parseRepoInput, promptForRepo } from '../detector'
import { fetchCommits, fetchLatestReleaseOrTagDate } from '../github'
import { formatChoices, formatters, isSupportedFormat } from '../formatters'
import { generateChangelogWithGroq } from '../providers/groq'
import { generateChangelogWithLogitApi } from '../providers/logit-api'
import {
  getConfig,
  getCustomFormats,
  setLastCustomPrompt
} from '../storage'
import type { Period, RepoInfo, SupportedFormat, SupportedLang } from '../types'
import {
  renderError,
  renderOutput,
  renderRepoBox,
  renderSplash,
  renderSuccessBox,
  renderWarning
} from '../ui'
import packageJson from '../../package.json'

interface GenerateOptions {
  repo?: string
  since?: string
  until?: string
  format?: string
  prompt?: string
  lang?: string
  output?: string
  copy?: boolean
}

interface RunGenerateOptions {
  interactive: boolean
}

interface PeriodAnswer {
  period: '7d' | '30d' | 'last-release' | 'custom'
  since?: string
  until?: string
}

interface FormatAnswer {
  format: SupportedFormat | 'saved'
}

interface SavedFormatAnswer {
  savedFormat: string
}

interface CustomPromptAnswer {
  prompt: string
}

interface LangAnswer {
  lang: SupportedLang
}

function isSupportedLang(value: string | undefined): value is SupportedLang {
  return value === 'pt-br' || value === 'en'
}

function startOfDayIso(date: Date): string {
  const nextDate = new Date(date)
  nextDate.setHours(0, 0, 0, 0)
  return nextDate.toISOString()
}

function subtractDays(date: Date, days: number): Date {
  const nextDate = new Date(date)
  nextDate.setDate(nextDate.getDate() - days)
  return nextDate
}

function formatDateLabel(value: string | undefined): string {
  if (!value) {
    return 'all available history'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('en', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date)
}

function periodLabel(period: Period): string {
  if (period.since && period.until) {
    return `${formatDateLabel(period.since)} - ${formatDateLabel(period.until)}`
  }

  if (period.since) {
    return `${formatDateLabel(period.since)} - today`
  }

  return period.label
}

async function promptForPeriod(repo: RepoInfo, githubToken: string | undefined): Promise<Period> {
  const answer = await inquirer.prompt<PeriodAnswer>([
    {
      type: 'list',
      name: 'period',
      message: 'Which commit period?',
      choices: [
        { name: 'Last 7 days', value: '7d' },
        { name: 'Last 30 days', value: '30d' },
        { name: 'Since latest tag/release', value: 'last-release' },
        { name: 'Custom interval', value: 'custom' }
      ]
    }
  ])

  const now = new Date()

  if (answer.period === '7d') {
    return {
      since: startOfDayIso(subtractDays(now, 7)),
      label: 'Last 7 days'
    }
  }

  if (answer.period === '30d') {
    return {
      since: startOfDayIso(subtractDays(now, 30)),
      label: 'Last 30 days'
    }
  }

  if (answer.period === 'last-release') {
    const spinner = ora('Finding latest release or tag...').start()
    const since = await fetchLatestReleaseOrTagDate({
      owner: repo.owner,
      repo: repo.repo,
      token: githubToken
    })
    spinner.succeed(since ? 'Latest release or tag found' : 'No release or tag found')

    return {
      since,
      label: since ? `Since latest release/tag (${formatDateLabel(since)})` : 'All available history'
    }
  }

  const custom = await inquirer.prompt<PeriodAnswer>([
    {
      type: 'input',
      name: 'since',
      message: 'Start date (YYYY-MM-DD):',
      validate: (value: string) => {
        const date = new Date(value)
        return !Number.isNaN(date.getTime()) || 'Use a valid date, for example 2024-01-01.'
      }
    },
    {
      type: 'input',
      name: 'until',
      message: 'End date (YYYY-MM-DD, optional):',
      validate: (value: string) => {
        if (!value.trim()) {
          return true
        }

        const date = new Date(value)
        return !Number.isNaN(date.getTime()) || 'Use a valid date, for example 2024-04-23.'
      }
    }
  ])

  return {
    since: custom.since ? startOfDayIso(new Date(custom.since)) : undefined,
    until: custom.until ? new Date(custom.until).toISOString() : undefined,
    label: 'Custom interval'
  }
}

async function resolvePeriod(
  options: GenerateOptions,
  interactive: boolean,
  repo: RepoInfo,
  githubToken: string | undefined
): Promise<Period> {
  if (options.since || options.until) {
    return {
      since: options.since ? startOfDayIso(new Date(options.since)) : undefined,
      until: options.until ? new Date(options.until).toISOString() : undefined,
      label: 'Custom interval'
    }
  }

  if (interactive) {
    return promptForPeriod(repo, githubToken)
  }

  return {
    since: startOfDayIso(subtractDays(new Date(), 7)),
    label: 'Last 7 days'
  }
}

async function promptForFormat(defaultFormat: SupportedFormat): Promise<{ format: SupportedFormat; prompt?: string }> {
  const choices: Array<{ name: string; value: SupportedFormat | 'saved' }> = formatChoices.map((formatter) => ({
    name: formatter.label,
    value: formatter.id
  }))
  const savedFormats = getCustomFormats()
  const hasSavedFormats = Object.keys(savedFormats).length > 0

  if (hasSavedFormats) {
    choices.push({
      name: '📁 My Formats      - Saved custom formats',
      value: 'saved'
    })
  }

  const answer = await inquirer.prompt<FormatAnswer>([
    {
      type: 'list',
      name: 'format',
      message: 'Which changelog format?',
      default: defaultFormat,
      choices
    }
  ])

  if (answer.format === 'saved') {
    const savedAnswer = await inquirer.prompt<SavedFormatAnswer>([
      {
        type: 'list',
        name: 'savedFormat',
        message: 'Which saved format?',
        choices: Object.keys(savedFormats)
      }
    ])

    return {
      format: 'custom',
      prompt: savedFormats[savedAnswer.savedFormat]
    }
  }

  if (answer.format === 'custom') {
    const custom = await inquirer.prompt<CustomPromptAnswer>([
      {
        type: 'input',
        name: 'prompt',
        message: 'Describe the format you want:',
        validate: (value: string) => value.trim().length > 0 || 'Describe the format first.'
      }
    ])

    return {
      format: 'custom',
      prompt: custom.prompt
    }
  }

  return {
    format: answer.format
  }
}

async function resolveFormat(
  options: GenerateOptions,
  interactive: boolean,
  defaultFormat: SupportedFormat
): Promise<{ format: SupportedFormat; prompt?: string }> {
  if (options.format) {
    if (!isSupportedFormat(options.format)) {
      throw new Error(`Unsupported format "${options.format}". Run logit formats list to see options.`)
    }

    return {
      format: options.format,
      prompt: options.prompt
    }
  }

  if (interactive) {
    return promptForFormat(defaultFormat)
  }

  return {
    format: defaultFormat,
    prompt: options.prompt
  }
}

async function resolveLang(options: GenerateOptions, interactive: boolean, defaultLang: SupportedLang): Promise<SupportedLang> {
  if (options.lang) {
    if (!isSupportedLang(options.lang)) {
      throw new Error('Unsupported language. Use pt-br or en.')
    }

    return options.lang
  }

  if (!interactive) {
    return defaultLang
  }

  const answer = await inquirer.prompt<LangAnswer>([
    {
      type: 'list',
      name: 'lang',
      message: 'Output language?',
      default: defaultLang,
      choices: [
        { name: 'Português (pt-br)', value: 'pt-br' },
        { name: 'English (en)', value: 'en' }
      ]
    }
  ])

  return answer.lang
}

async function resolveRepo(options: GenerateOptions, detectedRepo: RepoInfo | undefined, interactive: boolean): Promise<RepoInfo> {
  if (options.repo) {
    const repo = parseRepoInput(options.repo)

    if (!repo) {
      throw new Error('Invalid repository. Use owner/repo.')
    }

    return {
      ...repo,
      branch: detectedRepo?.branch
    }
  }

  if (detectedRepo && !interactive) {
    return detectedRepo
  }

  return promptForRepo(detectedRepo?.fullName)
}

async function writeOutput(filePath: string, content: string): Promise<string> {
  const resolvedPath = path.resolve(process.cwd(), filePath)
  await fs.mkdir(path.dirname(resolvedPath), { recursive: true })
  await fs.writeFile(resolvedPath, content, 'utf8')
  return resolvedPath
}

export function createGenerateCommand(): Command {
  const command = new Command('generate')
    .description('Generate an AI-powered changelog')
    .option('-r, --repo <owner/repo>', 'GitHub repository')
    .option('-s, --since <date>', 'start date, for example 2024-01-01')
    .option('-u, --until <date>', 'end date, for example 2024-04-23')
    .option('-f, --format <format>', 'markdown, discord, twitter, release-notes, email, json, or custom')
    .option('-p, --prompt <prompt>', 'custom format prompt')
    .option('-l, --lang <lang>', 'pt-br or en')
    .option('-o, --output <path>', 'write changelog to a file')
    .option('--copy', 'copy generated changelog to clipboard')
    .action(async (options: GenerateOptions) => {
      const interactive = process.argv.slice(3).length === 0
      await runGenerate(options, { interactive })
    })

  return command
}

export async function runGenerate(
  options: GenerateOptions,
  runOptions: RunGenerateOptions = { interactive: false }
): Promise<void> {
  const config = getConfig()
  const groqKey = resolveGroqKey(config)
  const githubToken = resolveGitHubToken(config)
  const defaultLang = config.lang ?? 'pt-br'
  const defaultFormat = config.format ?? 'markdown'

  if (!isSupportedFormat(defaultFormat)) {
    throw new Error('Stored default format is invalid. Run logit config set format markdown.')
  }

  const detectedRepo = detectGitHubRepo()
  renderSplash(packageJson.version, packageJson.author)
  const repoFromOption = options.repo ? parseRepoInput(options.repo) : undefined

  if (options.repo && !repoFromOption) {
    throw new Error('Invalid repository. Use owner/repo.')
  }

  const visibleRepo = repoFromOption
    ? {
        ...repoFromOption,
        branch: detectedRepo?.branch
      }
    : detectedRepo

  if (visibleRepo) {
    renderRepoBox(visibleRepo)
  }

  const repo = await resolveRepo(options, detectedRepo, runOptions.interactive)

  if (!visibleRepo || visibleRepo.fullName !== repo.fullName) {
    renderRepoBox(repo)
  }
  const period = await resolvePeriod(options, runOptions.interactive, repo, githubToken.value)
  const lang = await resolveLang(options, runOptions.interactive, defaultLang)
  const selectedFormat = await resolveFormat(options, runOptions.interactive, defaultFormat)

  if (selectedFormat.format === 'custom' && !selectedFormat.prompt) {
    throw new Error('Use --prompt when --format custom is set.')
  }

  if (selectedFormat.prompt) {
    setLastCustomPrompt(selectedFormat.prompt)
  }

  if (!githubToken.value) {
    renderWarning(
      'GitHub token is not configured. Public API limit is 60 requests/hour. For private repos or higher limits, run: logit config set github-token <token>'
    )
  }

  const commitsSpinner = ora('Fetching commits via GitHub API...').start()
  const commits = await fetchCommits({
    owner: repo.owner,
    repo: repo.repo,
    since: period.since,
    until: period.until,
    token: githubToken.value
  })
  commitsSpinner.succeed(`${commits.length} commits found`)

  if (commits.length === 0) {
    renderWarning('No commits found for this period.')
  }

  const formatter = formatters[selectedFormat.format]
  const periodText = periodLabel(period)
  const formatDescription = formatter.buildPrompt({
      commits,
      lang,
      repo: repo.fullName,
      period: periodText,
      generatedAt: new Date().toISOString().slice(0, 10),
      customPrompt: selectedFormat.prompt
    })
  const aiSpinner = ora(groqKey.value ? 'Generating changelog with Groq AI...' : 'Generating changelog with Logit API...').start()
  const changelog = groqKey.value
    ? await generateChangelogWithGroq({
        apiKey: groqKey.value,
        commits,
        lang,
        formatDescription
      })
    : await generateChangelogWithLogitApi({
        commits,
        lang,
        formatDescription
      })
  aiSpinner.succeed('Changelog generated')

  let outputPath: string | undefined

  if (options.output) {
    outputPath = await writeOutput(options.output, changelog)
  }

  if (options.copy) {
    await clipboardy.write(changelog)
  }

  renderSuccessBox({
    format: formatter.shortLabel,
    commits: commits.length,
    period: periodText,
    output: outputPath,
    copied: options.copy
  })

  if (!options.output) {
    const shouldRenderMarkdown = selectedFormat.format === 'markdown' || selectedFormat.format === 'release-notes'
    console.log(chalk.cyan('\nGenerated changelog\n'))
    renderOutput(changelog, shouldRenderMarkdown)
  }
}

export function handleGenerateError(error: unknown): void {
  if (error instanceof Error) {
    renderError(error.message)
    return
  }

  renderError('Unexpected error.')
}
