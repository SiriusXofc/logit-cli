# logit

[![npm version](https://img.shields.io/npm/v/logit-cli.svg)](https://www.npmjs.com/package/logit-cli)

AI-powered changelog generator for GitHub repositories. `logit` fetches commits, asks Groq to turn them into a polished changelog, and prints or saves the result in formats made for developers, release managers, and communities.

![Terminal demo placeholder](https://placehold.co/900x480/071013/00D4FF?text=logit+terminal+demo)

## Installation

```bash
npm install -g logit-cli
```

Until the npm package is published, install directly from GitHub:

```bash
npm install -g github:SiriusXofc/logit-cli
```

Or run it locally from this repository:

```bash
pnpm install
pnpm build
pnpm start
```

## Quickstart

```bash
npm install -g logit-cli
logit generate --repo facebook/react --since 2024-01-01 --format markdown --lang en
```

Without flags, `logit` opens an interactive flow that detects the current GitHub repo when possible. By default it uses the hosted Logit API, so users do not need a Groq key to get started.

Hosted API:

```text
https://logit-cli.vercel.app/api/generate
```

## Commands

### Generate

```bash
logit generate
logit generate --repo owner/repo
logit generate --since 2024-01-01
logit generate --until 2024-04-23
logit generate --format discord
logit generate --format custom --prompt "informal blog post in pt-br"
logit generate --lang pt-br
logit generate --output ./CHANGELOG.md
logit generate --copy
```

Available formats:

- `markdown` - standard `CHANGELOG.md`
- `discord` - Discord-ready markdown
- `twitter` - short Twitter/X thread
- `release-notes` - GitHub Release Notes
- `email` - simple HTML newsletter
- `json` - structured JSON
- `custom` - user-defined format prompt

### Config

```bash
logit config setup
logit config set groq-key sk-...
logit config set github-token ghp_...
logit config set lang pt-br
logit config set format discord
logit config show
logit config reset
```

Config is stored locally with `conf` at `~/.config/logit/config.json`. Secret values are never printed by `logit config show`.

You can also avoid storing keys by using environment variables:

```bash
GROQ_API_KEY=<key> logit generate --repo owner/repo
GITHUB_TOKEN=<token> GROQ_API_KEY=<key> logit generate --repo owner/repo
```

On PowerShell:

```powershell
$env:GROQ_API_KEY="<key>"
logit generate --repo owner/repo
```

### Saved Formats

```bash
logit formats list
logit formats save "blog-ptbr"
logit formats save "blog-ptbr" --prompt "informal product update in Brazilian Portuguese"
logit formats delete "blog-ptbr"
logit formats use "blog-ptbr"
```

`formats save` stores the last custom prompt generated with `logit generate --format custom --prompt "..."`

## Getting API Keys

### Groq

1. Open [console.groq.com](https://console.groq.com/).
2. Create or copy an API key.
3. Run the secure setup prompt if you want to use your own key instead of the shared hosted Logit API:

```bash
logit config setup
```

The key is never bundled into the npm package. It is either read from the user's environment (`GROQ_API_KEY`) or saved only on that user's machine. You can point the CLI at another backend with `LOGIT_API_URL`.

If you want users to use your Groq billing key without seeing it, do not put that key in the CLI. Host a small backend endpoint instead: CLI -> your API -> Groq. Keep the Groq key on the server, add auth/rate limits, and have the CLI call your backend.

### GitHub

GitHub auth is optional for public repositories, but unauthenticated requests are limited to 60 requests per hour.

1. Open [GitHub Personal Access Tokens](https://github.com/settings/tokens).
2. Create a token with repo read access for private repositories.
3. Save it locally:

```bash
logit config set github-token <token>
```

## Development

```bash
pnpm install
pnpm typecheck
pnpm build
node dist/index.js generate --repo facebook/react --since 2024-01-01 --format json --lang en
```

## Requirements

- Node.js 18+
- pnpm for local development
- Git installed for automatic repository detection

## Publishing

The package exposes a `logit` binary through `dist/index.js`.

```bash
pnpm build
npm publish
```

The GitHub repository is public at [SiriusXofc/logit-cli](https://github.com/SiriusXofc/logit-cli).
