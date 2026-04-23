import { Command } from 'commander'
import { createConfigCommand } from './commands/config'
import { createFormatsCommand } from './commands/formats'
import { createGenerateCommand, handleGenerateError, runGenerate } from './commands/generate'
import packageJson from '../package.json'

async function main(): Promise<void> {
  const program = new Command()

  program
    .name('logit')
    .description('AI-powered changelog generator for developers')
    .version(packageJson.version)

  program.addCommand(createGenerateCommand())
  program.addCommand(createConfigCommand())
  program.addCommand(createFormatsCommand())

  if (process.argv.length <= 2) {
    await runGenerate({}, { interactive: true })
    return
  }

  await program.parseAsync(process.argv)
}

main().catch((error: unknown) => {
  handleGenerateError(error)
  process.exitCode = 1
})
