import boxen from 'boxen'
import chalk from 'chalk'
import figlet from 'figlet'
import { marked } from 'marked'
import { markedTerminal } from 'marked-terminal'
import type { RepoInfo } from './types'

const primary = chalk.hex('#00D4FF')
const muted = chalk.gray

marked.use(markedTerminal())

interface SuccessBoxOptions {
  format: string
  commits: number
  period: string
  output?: string
  copied?: boolean
}

export function renderSplash(version: string, author: string): void {
  const title = figlet.textSync('logit', {
    horizontalLayout: 'default',
    verticalLayout: 'default'
  })

  console.log(primary(title))
  console.log(chalk.white(`  v${version} — Changelog generator powered by AI`))
  console.log(chalk.white(`  by ${author}`))
  console.log('')
}

export function renderRepoBox(repo: RepoInfo | undefined): void {
  if (!repo) {
    console.log(
      boxen(`${chalk.white('Repository not detected.')}\n${muted('You can enter owner/repo in the next prompt.')}`, {
        padding: 1,
        margin: 1,
        borderStyle: 'round',
        borderColor: 'cyan'
      })
    )
    return
  }

  const lines = [`Detected repo: ${chalk.white(repo.fullName)}`, `Branch: ${chalk.white(repo.branch ?? 'unknown')}`]

  console.log(
    boxen(lines.join('\n'), {
      padding: 1,
      margin: 1,
      borderStyle: 'round',
      borderColor: 'cyan'
    })
  )
}

export function renderSuccessBox(options: SuccessBoxOptions): void {
  const lines = [
    `${chalk.green('✔')} Changelog generated successfully!`,
    '',
    `${chalk.cyan('Format')}  : ${options.format}`,
    `${chalk.cyan('Commits')}  : ${options.commits}`,
    `${chalk.cyan('Period')}   : ${options.period}`
  ]

  if (options.output) {
    lines.push(`${chalk.cyan('Saved to')} : ${options.output}`)
  }

  if (options.copied) {
    lines.push(`${chalk.cyan('Copied')}  : yes`)
  }

  console.log(
    boxen(lines.join('\n'), {
      padding: 1,
      margin: 1,
      borderStyle: 'round',
      borderColor: 'green'
    })
  )
}

export function renderOutput(content: string, renderAsMarkdown: boolean): void {
  if (renderAsMarkdown) {
    console.log(marked(content))
    return
  }

  console.log(content)
}

export function renderWarning(message: string): void {
  console.log(chalk.yellow(`Warning: ${message}`))
}

export function renderError(message: string): void {
  console.error(chalk.red(`Error: ${message}`))
}

export function renderInfo(message: string): void {
  console.log(chalk.cyan(message))
}
