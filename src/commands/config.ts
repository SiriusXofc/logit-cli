import { Command } from 'commander'
import chalk from 'chalk'
import inquirer from 'inquirer'
import { resolveGitHubToken, resolveGroqKey } from '../credentials'
import { formatChoices, isSupportedFormat } from '../formatters'
import {
  getConfig,
  getConfigPath,
  maskSecret,
  resetConfig,
  setConfigValue
} from '../storage'
import type { SupportedFormat, SupportedLang } from '../types'

interface SetupAnswers {
  groqKey?: string
  githubToken?: string
  lang: SupportedLang
  format: SupportedFormat
}

function isSupportedLang(value: string): value is SupportedLang {
  return value === 'pt-br' || value === 'en'
}

function sourceLabel(source: 'config' | 'env' | 'missing'): string {
  if (source === 'env') {
    return 'env'
  }

  if (source === 'config') {
    return 'local config'
  }

  return 'missing'
}

export function createConfigCommand(): Command {
  const command = new Command('config')
    .description('Manage local logit configuration')

  command
    .command('setup')
    .description('Run interactive setup')
    .action(async () => {
      const config = getConfig()
      const groqKey = resolveGroqKey(config)
      const githubToken = resolveGitHubToken(config)

      const answers = await inquirer.prompt<SetupAnswers>([
        {
          type: 'password',
          name: 'groqKey',
          message: 'Own Groq API key (optional, press enter to use the shared Logit API):',
          mask: '*',
          when: () => !groqKey.value,
        },
        {
          type: 'password',
          name: 'githubToken',
          message: 'GitHub token (optional, press enter to skip):',
          mask: '*',
          when: () => !githubToken.value
        },
        {
          type: 'list',
          name: 'lang',
          message: 'Default output language:',
          default: config.lang ?? 'pt-br',
          choices: [
            { name: 'Portuguese (pt-br)', value: 'pt-br' },
            { name: 'English (en)', value: 'en' }
          ]
        },
        {
          type: 'list',
          name: 'format',
          message: 'Default changelog format:',
          default: config.format ?? 'markdown',
          choices: formatChoices.map((formatter) => ({
            name: `${formatter.shortLabel} - ${formatter.description}`,
            value: formatter.id
          }))
        }
      ])

      if (answers.groqKey) {
        setConfigValue('groqKey', answers.groqKey.trim())
      }

      if (answers.githubToken?.trim()) {
        setConfigValue('githubToken', answers.githubToken.trim())
      }

      setConfigValue('lang', answers.lang)
      setConfigValue('format', answers.format)

      console.log(chalk.green('Setup complete. You can now run: logit generate'))
    })

  command
    .command('set')
    .argument('<key>', 'groq-key, github-token, lang, or format')
    .argument('<value>', 'value to store')
    .description('Set a config value')
    .action((key: string, value: string) => {
      if (key === 'groq-key') {
        setConfigValue('groqKey', value)
        console.log(chalk.green('Saved Groq API key.'))
        return
      }

      if (key === 'github-token') {
        setConfigValue('githubToken', value)
        console.log(chalk.green('Saved GitHub token.'))
        return
      }

      if (key === 'lang') {
        if (!isSupportedLang(value)) {
          throw new Error('Unsupported language. Use pt-br or en.')
        }

        setConfigValue('lang', value)
        console.log(chalk.green(`Default language set to ${value}.`))
        return
      }

      if (key === 'format') {
        if (!isSupportedFormat(value)) {
          throw new Error('Unsupported format. Run logit formats list to see options.')
        }

        setConfigValue('format', value)
        console.log(chalk.green(`Default format set to ${value}.`))
        return
      }

      throw new Error('Unknown config key. Use groq-key, github-token, lang, or format.')
    })

  command
    .command('show')
    .description('Show current config')
    .action(() => {
      const config = getConfig()
      const groqKey = resolveGroqKey(config)
      const githubToken = resolveGitHubToken(config)

      console.log(chalk.cyan('logit config'))
      console.log(`Path         : ${getConfigPath()}`)
      console.log(`Groq key     : ${maskSecret(groqKey.value)} (${sourceLabel(groqKey.source)})`)
      console.log(`GitHub token : ${maskSecret(githubToken.value)} (${sourceLabel(githubToken.source)})`)
      console.log(`Language     : ${config.lang ?? 'pt-br'}`)
      console.log(`Format       : ${config.format ?? 'markdown'}`)
    })

  command
    .command('reset')
    .description('Clear all config')
    .action(() => {
      resetConfig()
      console.log(chalk.green('Config reset.'))
    })

  return command
}
