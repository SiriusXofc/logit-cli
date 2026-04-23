import { Command } from 'commander'
import chalk from 'chalk'
import inquirer from 'inquirer'
import { formatChoices } from '../formatters'
import {
  deleteCustomFormat,
  getCustomFormat,
  getCustomFormats,
  getLastCustomPrompt,
  saveCustomFormat
} from '../storage'
import { runGenerate } from './generate'

interface PromptAnswer {
  prompt: string
}

export function createFormatsCommand(): Command {
  const command = new Command('formats')
    .description('List and manage saved custom formats')

  command
    .command('list')
    .description('List built-in and saved formats')
    .action(() => {
      console.log(chalk.cyan('Built-in formats'))
      for (const formatter of formatChoices) {
        console.log(`- ${formatter.id.padEnd(13)} ${formatter.description}`)
      }

      const customFormats = getCustomFormats()
      const names = Object.keys(customFormats)
      console.log('')
      console.log(chalk.cyan('Saved custom formats'))

      if (names.length === 0) {
        console.log('No saved custom formats yet.')
        return
      }

      for (const name of names) {
        console.log(`- ${name}`)
      }
    })

  command
    .command('save')
    .argument('<name>', 'name for the saved custom format')
    .option('-p, --prompt <prompt>', 'custom prompt to save')
    .description('Save the last custom prompt, or pass one with --prompt')
    .action(async (name: string, options: { prompt?: string }) => {
      let prompt = options.prompt ?? getLastCustomPrompt()

      if (!prompt) {
        const answer = await inquirer.prompt<PromptAnswer>([
          {
            type: 'input',
            name: 'prompt',
            message: 'Describe the custom format to save:',
            validate: (value: string) => value.trim().length > 0 || 'Describe the format first.'
          }
        ])
        prompt = answer.prompt
      }

      const promptToSave = prompt

      if (!promptToSave) {
        throw new Error('No custom prompt available to save.')
      }

      saveCustomFormat(name, promptToSave)
      console.log(chalk.green(`Saved custom format "${name}".`))
    })

  command
    .command('delete')
    .argument('<name>', 'saved custom format name')
    .description('Delete a saved custom format')
    .action((name: string) => {
      const deleted = deleteCustomFormat(name)

      if (!deleted) {
        throw new Error(`No saved custom format named "${name}".`)
      }

      console.log(chalk.green(`Deleted custom format "${name}".`))
    })

  command
    .command('use')
    .argument('<name>', 'saved custom format name')
    .description('Generate using a saved custom format')
    .action(async (name: string) => {
      const prompt = getCustomFormat(name)

      if (!prompt) {
        throw new Error(`No saved custom format named "${name}".`)
      }

      await runGenerate(
        {
          format: 'custom',
          prompt
        },
        {
          interactive: false
        }
      )
    })

  return command
}
