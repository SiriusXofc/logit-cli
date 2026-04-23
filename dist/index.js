#!/usr/bin/env node
"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// src/index.ts
var import_commander4 = require("commander");

// src/commands/config.ts
var import_commander = require("commander");
var import_chalk = __toESM(require("chalk"));
var import_inquirer = __toESM(require("inquirer"));

// src/credentials.ts
function readEnv(names) {
  for (const name of names) {
    const value = process.env[name]?.trim();
    if (value) {
      return {
        value,
        source: "env"
      };
    }
  }
  return {
    source: "missing"
  };
}
function resolveGroqKey(config) {
  const envValue = readEnv(["GROQ_API_KEY"]);
  if (envValue.value) {
    return envValue;
  }
  if (config.groqKey) {
    return {
      value: config.groqKey,
      source: "config"
    };
  }
  return {
    source: "missing"
  };
}
function resolveGitHubToken(config) {
  const envValue = readEnv(["GITHUB_TOKEN", "GH_TOKEN"]);
  if (envValue.value) {
    return envValue;
  }
  if (config.githubToken) {
    return {
      value: config.githubToken,
      source: "config"
    };
  }
  return {
    source: "missing"
  };
}

// src/formatters/custom.ts
var customFormatter = {
  id: "custom",
  label: "\u270F\uFE0F  Other           - Describe what you want",
  shortLabel: "Custom",
  description: "User-described custom format",
  buildPrompt: (context) => context.customPrompt ?? "Generate a professional changelog in a custom format."
};

// src/formatters/discord.ts
var discordFormatter = {
  id: "discord",
  label: "\u{1F3AE} Discord         - Webhook-ready message",
  shortLabel: "Discord Embed",
  description: "Discord webhook-ready markdown",
  buildPrompt: (context) => `Generate Discord-friendly markdown for a release update.

Use this shape:
**\u{1F4E6} ${context.repo} \u2014 Update**
> Period: ${context.period}

\u2728 **Features**
\u2022 One concise change

\u{1F41B} **Fixes**
\u2022 One concise change

[View commits](https://github.com/${context.repo}/commits)

Keep it compact, readable, and ready to paste into Discord.`
};

// src/formatters/email.ts
var emailFormatter = {
  id: "email",
  label: "\u{1F4E7} Email           - Newsletter update",
  shortLabel: "Email",
  description: "Simple HTML newsletter",
  buildPrompt: (context) => `Generate a simple HTML newsletter update for ${context.repo}.

Return only valid HTML suitable for an email body. Use:
- <h1> for the title
- <p> for a short intro
- <h2> for grouped sections
- <ul><li> for changes

Keep CSS inline-free and simple.`
};

// src/formatters/json.ts
var jsonFormatter = {
  id: "json",
  label: "\u{1F537} JSON            - Structured output",
  shortLabel: "JSON",
  description: "Structured JSON changelog",
  buildPrompt: (context) => `Generate valid JSON only. Do not wrap it in Markdown.

Use this schema:
{
  "version": "unreleased",
  "date": "${context.generatedAt}",
  "repo": "${context.repo}",
  "period": "${context.period}",
  "changes": {
    "features": [],
    "fixes": [],
    "breaking": [],
    "improvements": [],
    "docs": []
  }
}`
};

// src/formatters/markdown.ts
var markdownFormatter = {
  id: "markdown",
  label: "\u{1F4C4} Markdown        - Standard CHANGELOG.md",
  shortLabel: "Markdown",
  description: "Standard CHANGELOG.md",
  buildPrompt: (context) => `Generate a standard CHANGELOG.md section.

Required structure:
## [Unreleased] \u2014 ${context.generatedAt}

### \u2728 Features
- One concise change

### \u{1F41B} Fixes
- One concise change

Include only sections that have relevant changes. Use clean Markdown.`
};

// src/formatters/release-notes.ts
var releaseNotesFormatter = {
  id: "release-notes",
  label: "\u{1F4E6} Release Notes   - GitHub Releases",
  shortLabel: "Release Notes",
  description: "GitHub Release Notes markdown",
  buildPrompt: () => `Generate GitHub Release Notes in clean Markdown.

Use restrained headings, professional wording, and no excessive emoji.
Group changes into:
- Highlights
- Fixes
- Improvements
- Documentation
- Breaking Changes, only when present`
};

// src/formatters/twitter.ts
var twitterFormatter = {
  id: "twitter",
  label: "\u{1F426} Twitter/X       - Short thread",
  shortLabel: "Twitter/X Thread",
  description: "Short Twitter/X thread",
  buildPrompt: (context) => `Generate a concise Twitter/X thread for ${context.repo}.

Rules:
- Start with a short announcement.
- Number each change as a thread item.
- Keep each post under 260 characters.
- End each post with a thread counter like [1/2].
- Do not include commit hashes.`
};

// src/formatters/index.ts
var formatters = {
  markdown: markdownFormatter,
  discord: discordFormatter,
  twitter: twitterFormatter,
  "release-notes": releaseNotesFormatter,
  email: emailFormatter,
  json: jsonFormatter,
  custom: customFormatter
};
var formatChoices = [
  formatters.markdown,
  formatters.discord,
  formatters.twitter,
  formatters["release-notes"],
  formatters.email,
  formatters.json,
  formatters.custom
];
function isSupportedFormat(format) {
  return Object.prototype.hasOwnProperty.call(formatters, format);
}

// src/storage.ts
var import_node_path = __toESM(require("path"));
var import_node_os = __toESM(require("os"));
var import_conf = __toESM(require("conf"));
var configRoot = import_node_path.default.join(import_node_os.default.homedir(), ".config", "logit");
var store = new import_conf.default({
  projectName: "logit",
  cwd: configRoot,
  configName: "config"
});
function getConfig() {
  return {
    groqKey: store.get("groqKey"),
    githubToken: store.get("githubToken"),
    lang: store.get("lang"),
    format: store.get("format"),
    customFormats: store.get("customFormats"),
    lastCustomPrompt: store.get("lastCustomPrompt")
  };
}
function setConfigValue(key, value) {
  store.set(key, value);
}
function resetConfig() {
  store.clear();
}
function getCustomFormats() {
  return store.get("customFormats") ?? {};
}
function getCustomFormat(name) {
  return getCustomFormats()[name];
}
function saveCustomFormat(name, prompt) {
  const formats = getCustomFormats();
  store.set("customFormats", {
    ...formats,
    [name]: prompt
  });
}
function deleteCustomFormat(name) {
  const formats = getCustomFormats();
  if (!(name in formats)) {
    return false;
  }
  const nextFormats = { ...formats };
  delete nextFormats[name];
  store.set("customFormats", nextFormats);
  return true;
}
function setLastCustomPrompt(prompt) {
  store.set("lastCustomPrompt", prompt);
}
function getLastCustomPrompt() {
  return store.get("lastCustomPrompt");
}
function maskSecret(value) {
  if (!value) {
    return "not configured";
  }
  return "configured";
}
function getConfigPath() {
  return store.path;
}

// src/commands/config.ts
function isSupportedLang(value) {
  return value === "pt-br" || value === "en";
}
function sourceLabel(source) {
  if (source === "env") {
    return "env";
  }
  if (source === "config") {
    return "local config";
  }
  return "missing";
}
function createConfigCommand() {
  const command = new import_commander.Command("config").description("Manage local logit configuration");
  command.command("setup").description("Run interactive setup").action(async () => {
    const config = getConfig();
    const groqKey = resolveGroqKey(config);
    const githubToken = resolveGitHubToken(config);
    const answers = await import_inquirer.default.prompt([
      {
        type: "password",
        name: "groqKey",
        message: "Own Groq API key (optional, press enter to use the shared Logit API):",
        mask: "*",
        when: () => !groqKey.value
      },
      {
        type: "password",
        name: "githubToken",
        message: "GitHub token (optional, press enter to skip):",
        mask: "*",
        when: () => !githubToken.value
      },
      {
        type: "list",
        name: "lang",
        message: "Default output language:",
        default: config.lang ?? "pt-br",
        choices: [
          { name: "Portuguese (pt-br)", value: "pt-br" },
          { name: "English (en)", value: "en" }
        ]
      },
      {
        type: "list",
        name: "format",
        message: "Default changelog format:",
        default: config.format ?? "markdown",
        choices: formatChoices.map((formatter) => ({
          name: `${formatter.shortLabel} - ${formatter.description}`,
          value: formatter.id
        }))
      }
    ]);
    if (answers.groqKey) {
      setConfigValue("groqKey", answers.groqKey.trim());
    }
    if (answers.githubToken?.trim()) {
      setConfigValue("githubToken", answers.githubToken.trim());
    }
    setConfigValue("lang", answers.lang);
    setConfigValue("format", answers.format);
    console.log(import_chalk.default.green("Setup complete. You can now run: logit generate"));
  });
  command.command("set").argument("<key>", "groq-key, github-token, lang, or format").argument("<value>", "value to store").description("Set a config value").action((key, value) => {
    if (key === "groq-key") {
      setConfigValue("groqKey", value);
      console.log(import_chalk.default.green("Saved Groq API key."));
      return;
    }
    if (key === "github-token") {
      setConfigValue("githubToken", value);
      console.log(import_chalk.default.green("Saved GitHub token."));
      return;
    }
    if (key === "lang") {
      if (!isSupportedLang(value)) {
        throw new Error("Unsupported language. Use pt-br or en.");
      }
      setConfigValue("lang", value);
      console.log(import_chalk.default.green(`Default language set to ${value}.`));
      return;
    }
    if (key === "format") {
      if (!isSupportedFormat(value)) {
        throw new Error("Unsupported format. Run logit formats list to see options.");
      }
      setConfigValue("format", value);
      console.log(import_chalk.default.green(`Default format set to ${value}.`));
      return;
    }
    throw new Error("Unknown config key. Use groq-key, github-token, lang, or format.");
  });
  command.command("show").description("Show current config").action(() => {
    const config = getConfig();
    const groqKey = resolveGroqKey(config);
    const githubToken = resolveGitHubToken(config);
    console.log(import_chalk.default.cyan("logit config"));
    console.log(`Path         : ${getConfigPath()}`);
    console.log(`Groq key     : ${maskSecret(groqKey.value)} (${sourceLabel(groqKey.source)})`);
    console.log(`GitHub token : ${maskSecret(githubToken.value)} (${sourceLabel(githubToken.source)})`);
    console.log(`Language     : ${config.lang ?? "pt-br"}`);
    console.log(`Format       : ${config.format ?? "markdown"}`);
  });
  command.command("reset").description("Clear all config").action(() => {
    resetConfig();
    console.log(import_chalk.default.green("Config reset."));
  });
  return command;
}

// src/commands/formats.ts
var import_commander3 = require("commander");
var import_chalk4 = __toESM(require("chalk"));
var import_inquirer4 = __toESM(require("inquirer"));

// src/commands/generate.ts
var import_promises = __toESM(require("fs/promises"));
var import_node_path2 = __toESM(require("path"));
var import_chalk3 = __toESM(require("chalk"));
var import_clipboardy = __toESM(require("clipboardy"));
var import_commander2 = require("commander");
var import_inquirer3 = __toESM(require("inquirer"));
var import_ora = __toESM(require("ora"));

// src/detector.ts
var import_node_child_process = require("child_process");
var import_inquirer2 = __toESM(require("inquirer"));
function parseGitHubRemote(remoteUrl) {
  const trimmed = remoteUrl.trim();
  const httpsMatch = trimmed.match(/^https:\/\/github\.com\/([^/\s]+)\/([^/\s]+?)(?:\.git)?\/?$/i);
  const sshMatch = trimmed.match(/^git@github\.com:([^/\s]+)\/([^/\s]+?)(?:\.git)?$/i);
  const sshProtocolMatch = trimmed.match(/^ssh:\/\/git@github\.com\/([^/\s]+)\/([^/\s]+?)(?:\.git)?$/i);
  const match = httpsMatch ?? sshMatch ?? sshProtocolMatch;
  if (!match) {
    return void 0;
  }
  const owner = match[1];
  const repo = match[2];
  return {
    owner,
    repo,
    fullName: `${owner}/${repo}`
  };
}
function parseRepoInput(input) {
  const trimmed = input.trim();
  const remote = parseGitHubRemote(trimmed);
  if (remote) {
    return remote;
  }
  const shorthand = trimmed.match(/^([^/\s]+)\/([^/\s]+)$/);
  if (!shorthand) {
    return void 0;
  }
  const owner = shorthand[1];
  const repo = shorthand[2].replace(/\.git$/i, "");
  return {
    owner,
    repo,
    fullName: `${owner}/${repo}`
  };
}
function detectGitHubRepo() {
  try {
    const remoteUrl = (0, import_node_child_process.execSync)("git remote get-url origin", {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"]
    });
    const repo = parseGitHubRemote(remoteUrl);
    if (!repo) {
      return void 0;
    }
    return {
      ...repo,
      branch: detectCurrentBranch()
    };
  } catch {
    return void 0;
  }
}
function detectCurrentBranch() {
  try {
    const branch = (0, import_node_child_process.execSync)("git rev-parse --abbrev-ref HEAD", {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"]
    }).trim();
    return branch.length > 0 ? branch : void 0;
  } catch {
    return void 0;
  }
}
async function promptForRepo(defaultRepo) {
  const answer = await import_inquirer2.default.prompt([
    {
      type: "input",
      name: "repo",
      message: "Which repository?",
      default: defaultRepo,
      validate: (value) => {
        return parseRepoInput(value) ? true : "Use owner/repo, https://github.com/owner/repo.git, or git@github.com:owner/repo.git";
      }
    }
  ]);
  const repo = parseRepoInput(answer.repo);
  if (!repo) {
    throw new Error("Invalid repository. Use owner/repo.");
  }
  return {
    ...repo,
    branch: detectCurrentBranch()
  };
}

// src/github.ts
var import_rest = require("@octokit/rest");
function createOctokit(token) {
  return new import_rest.Octokit(token ? { auth: token } : {});
}
function isRequestErrorLike(error) {
  return typeof error === "object" && error !== null;
}
function normalizeGitHubError(error) {
  if (!isRequestErrorLike(error)) {
    return new Error("GitHub request failed. Please try again.");
  }
  if (error.status === 404) {
    return new Error(
      "Repository not found. Check the repo name, or configure a GitHub token if it is private: logit config set github-token <token>"
    );
  }
  if (error.status === 403) {
    const reset = error.response?.headers?.["x-ratelimit-reset"];
    const resetHint = reset ? ` Rate limit resets at ${new Date(Number(reset) * 1e3).toLocaleString()}.` : "";
    return new Error(
      `GitHub rate limit reached. Configure a token with: logit config set github-token <token>.${resetHint}`
    );
  }
  return new Error(error.message ?? "GitHub request failed. Please try again.");
}
async function fetchCommits(options) {
  const octokit = createOctokit(options.token);
  const commits = [];
  let page = 1;
  try {
    while (true) {
      const response = await octokit.repos.listCommits({
        owner: options.owner,
        repo: options.repo,
        since: options.since,
        until: options.until,
        per_page: 100,
        page
      });
      for (const item of response.data) {
        commits.push({
          sha: item.sha,
          message: item.commit.message.split("\n")[0] ?? item.commit.message,
          author: item.commit.author?.name ?? item.author?.login ?? "Unknown",
          date: item.commit.author?.date ?? item.commit.committer?.date ?? "",
          url: item.html_url
        });
      }
      if (response.data.length < 100) {
        break;
      }
      page += 1;
    }
    return commits;
  } catch (error) {
    throw normalizeGitHubError(error);
  }
}
async function fetchLatestReleaseOrTagDate(options) {
  const octokit = createOctokit(options.token);
  try {
    const latestRelease = await octokit.repos.getLatestRelease({
      owner: options.owner,
      repo: options.repo
    });
    return latestRelease.data.published_at ?? latestRelease.data.created_at;
  } catch (error) {
    if (!isRequestErrorLike(error) || error.status !== 404) {
      throw normalizeGitHubError(error);
    }
  }
  try {
    const tags = await octokit.repos.listTags({
      owner: options.owner,
      repo: options.repo,
      per_page: 1
    });
    const latestTag = tags.data[0];
    if (!latestTag) {
      return void 0;
    }
    const tagCommits = await octokit.repos.listCommits({
      owner: options.owner,
      repo: options.repo,
      sha: latestTag.name,
      per_page: 1
    });
    return tagCommits.data[0]?.commit.author?.date ?? tagCommits.data[0]?.commit.committer?.date;
  } catch (error) {
    throw normalizeGitHubError(error);
  }
}

// src/providers/groq.ts
var import_groq_sdk = __toESM(require("groq-sdk"));
function isGroqErrorLike(error) {
  return typeof error === "object" && error !== null;
}
function formatCommitsForPrompt(commits) {
  return commits.map((commit) => {
    const date = commit.date ? commit.date.slice(0, 10) : "unknown date";
    return `- ${date} | ${commit.author} | ${commit.message}`;
  }).join("\n");
}
function normalizeGroqError(error) {
  if (!isGroqErrorLike(error)) {
    return new Error("Groq request failed. Please try again.");
  }
  if (error.status === 401) {
    return new Error("Groq authentication failed. Check your key with: logit config setup, logit config set groq-key <key>, or GROQ_API_KEY=<key>.");
  }
  if (error.status === 429) {
    const retryAfter = error.headers?.["retry-after"];
    const retryHint = retryAfter ? ` Try again in ${retryAfter} seconds.` : " Try again in a moment.";
    return new Error(`Groq rate limit reached.${retryHint}`);
  }
  return new Error(error.error?.message ?? error.message ?? "Groq request failed. Please try again.");
}
async function generateChangelogWithGroq(options) {
  const client = new import_groq_sdk.default({
    apiKey: options.apiKey
  });
  const prompt = `Voc\xEA \xE9 um assistente especializado em gerar changelogs profissionais.
Analise os commits abaixo e gere um changelog no formato solicitado.

Regras:
- Agrupe por tipo: \u2728 Features, \u{1F41B} Fixes, \u{1F4A5} Breaking Changes, \u{1F527} Improvements, \u{1F4DA} Docs
- Ignore commits triviais (merge, typo, wip, bump version)
- Escreva de forma clara e objetiva no idioma: ${options.lang}
- N\xE3o inclua hashes de commit
- M\xE1ximo de 1 frase por item

Commits:
${formatCommitsForPrompt(options.commits)}

Formato desejado: ${options.formatDescription}`;
  try {
    const completion = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      temperature: 0.35,
      messages: [
        {
          role: "system",
          content: "You generate professional changelogs from git commit history. Follow the requested output format exactly."
        },
        {
          role: "user",
          content: prompt
        }
      ]
    });
    const content = completion.choices[0]?.message?.content?.trim();
    if (!content) {
      throw new Error("Groq returned an empty changelog.");
    }
    return content;
  } catch (error) {
    throw normalizeGroqError(error);
  }
}

// src/providers/logit-api.ts
var DEFAULT_LOGIT_API_URL = "https://logit-cli.vercel.app/api/generate";
function isLogitApiSuccess(value) {
  return typeof value === "object" && value !== null && "changelog" in value && typeof value.changelog === "string";
}
function isLogitApiError(value) {
  return typeof value === "object" && value !== null && "error" in value && typeof value.error === "string";
}
function getLogitApiUrl() {
  return process.env.LOGIT_API_URL?.trim() || DEFAULT_LOGIT_API_URL;
}
async function generateChangelogWithLogitApi(options) {
  const apiUrl = options.apiUrl ?? getLogitApiUrl();
  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "user-agent": "logit-cli/1.0.0",
      "x-logit-client": "logit-cli"
    },
    body: JSON.stringify({
      commits: options.commits,
      formatDescription: options.formatDescription,
      lang: options.lang
    })
  });
  const payload = await response.json().catch(() => void 0);
  if (!response.ok) {
    const message = isLogitApiError(payload) ? payload.error : `Logit API returned HTTP ${response.status}.`;
    throw new Error(`${message} You can also configure your own Groq key with: logit config setup`);
  }
  if (!isLogitApiSuccess(payload) || payload.changelog.trim().length === 0) {
    throw new Error("Logit API returned an empty changelog.");
  }
  return payload.changelog.trim();
}

// src/ui.ts
var import_boxen = __toESM(require("boxen"));
var import_chalk2 = __toESM(require("chalk"));
var import_figlet = __toESM(require("figlet"));
var import_marked = require("marked");
var import_marked_terminal = require("marked-terminal");
var primary = import_chalk2.default.hex("#00D4FF");
var muted = import_chalk2.default.gray;
import_marked.marked.use((0, import_marked_terminal.markedTerminal)());
function renderSplash(version, author) {
  const title = import_figlet.default.textSync("logit", {
    horizontalLayout: "default",
    verticalLayout: "default"
  });
  console.log(primary(title));
  console.log(import_chalk2.default.white(`  v${version} \u2014 Changelog generator powered by AI`));
  console.log(import_chalk2.default.white(`  by ${author}`));
  console.log("");
}
function renderRepoBox(repo) {
  if (!repo) {
    console.log(
      (0, import_boxen.default)(`${import_chalk2.default.white("Repository not detected.")}
${muted("You can enter owner/repo in the next prompt.")}`, {
        padding: 1,
        margin: 1,
        borderStyle: "round",
        borderColor: "cyan"
      })
    );
    return;
  }
  const lines = [`Detected repo: ${import_chalk2.default.white(repo.fullName)}`, `Branch: ${import_chalk2.default.white(repo.branch ?? "unknown")}`];
  console.log(
    (0, import_boxen.default)(lines.join("\n"), {
      padding: 1,
      margin: 1,
      borderStyle: "round",
      borderColor: "cyan"
    })
  );
}
function renderSuccessBox(options) {
  const lines = [
    `${import_chalk2.default.green("\u2714")} Changelog generated successfully!`,
    "",
    `${import_chalk2.default.cyan("Format")}  : ${options.format}`,
    `${import_chalk2.default.cyan("Commits")}  : ${options.commits}`,
    `${import_chalk2.default.cyan("Period")}   : ${options.period}`
  ];
  if (options.output) {
    lines.push(`${import_chalk2.default.cyan("Saved to")} : ${options.output}`);
  }
  if (options.copied) {
    lines.push(`${import_chalk2.default.cyan("Copied")}  : yes`);
  }
  console.log(
    (0, import_boxen.default)(lines.join("\n"), {
      padding: 1,
      margin: 1,
      borderStyle: "round",
      borderColor: "green"
    })
  );
}
function renderOutput(content, renderAsMarkdown) {
  if (renderAsMarkdown) {
    console.log((0, import_marked.marked)(content));
    return;
  }
  console.log(content);
}
function renderWarning(message) {
  console.log(import_chalk2.default.yellow(`Warning: ${message}`));
}
function renderError(message) {
  console.error(import_chalk2.default.red(`Error: ${message}`));
}

// package.json
var package_default = {
  name: "logit-cli",
  version: "1.0.0",
  description: "AI-powered changelog generator for developers",
  author: "Logit",
  license: "MIT",
  repository: {
    type: "git",
    url: "git+https://github.com/SiriusXofc/logit-cli.git"
  },
  bugs: {
    url: "https://github.com/SiriusXofc/logit-cli/issues"
  },
  homepage: "https://github.com/SiriusXofc/logit-cli#readme",
  packageManager: "pnpm@10.33.1",
  main: "./dist/index.js",
  types: "./dist/index.d.ts",
  keywords: [
    "changelog",
    "git",
    "github",
    "groq",
    "ai",
    "cli"
  ],
  bin: {
    logit: "./dist/index.js"
  },
  files: [
    "dist",
    "README.md",
    "LICENSE"
  ],
  scripts: {
    build: "tsup",
    dev: "tsup --watch",
    start: "node dist/index.js",
    typecheck: "tsc --noEmit",
    "vercel-build": "pnpm build"
  },
  engines: {
    node: ">=18"
  },
  dependencies: {
    "@octokit/rest": "^21.1.1",
    boxen: "^7.1.1",
    chalk: "^5.3.0",
    clipboardy: "^4.0.0",
    commander: "^12.1.0",
    conf: "^12.0.0",
    figlet: "^1.8.0",
    "groq-sdk": "^0.9.1",
    inquirer: "^9.3.7",
    marked: "^13.0.3",
    "marked-terminal": "^7.2.0",
    ora: "^8.0.1"
  },
  devDependencies: {
    "@types/figlet": "^1.7.0",
    "@types/inquirer": "^9.0.9",
    "@types/node": "^20.17.10",
    "@vercel/node": "^5.7.13",
    tsup: "^8.3.5",
    typescript: "^5.7.2"
  }
};

// src/commands/generate.ts
function isSupportedLang2(value) {
  return value === "pt-br" || value === "en";
}
function startOfDayIso(date) {
  const nextDate = new Date(date);
  nextDate.setHours(0, 0, 0, 0);
  return nextDate.toISOString();
}
function subtractDays(date, days) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() - days);
  return nextDate;
}
function formatDateLabel(value) {
  if (!value) {
    return "all available history";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);
}
function periodLabel(period) {
  if (period.since && period.until) {
    return `${formatDateLabel(period.since)} - ${formatDateLabel(period.until)}`;
  }
  if (period.since) {
    return `${formatDateLabel(period.since)} - today`;
  }
  return period.label;
}
async function promptForPeriod(repo, githubToken) {
  const answer = await import_inquirer3.default.prompt([
    {
      type: "list",
      name: "period",
      message: "Which commit period?",
      choices: [
        { name: "Last 7 days", value: "7d" },
        { name: "Last 30 days", value: "30d" },
        { name: "Since latest tag/release", value: "last-release" },
        { name: "Custom interval", value: "custom" }
      ]
    }
  ]);
  const now = /* @__PURE__ */ new Date();
  if (answer.period === "7d") {
    return {
      since: startOfDayIso(subtractDays(now, 7)),
      label: "Last 7 days"
    };
  }
  if (answer.period === "30d") {
    return {
      since: startOfDayIso(subtractDays(now, 30)),
      label: "Last 30 days"
    };
  }
  if (answer.period === "last-release") {
    const spinner = (0, import_ora.default)("Finding latest release or tag...").start();
    const since = await fetchLatestReleaseOrTagDate({
      owner: repo.owner,
      repo: repo.repo,
      token: githubToken
    });
    spinner.succeed(since ? "Latest release or tag found" : "No release or tag found");
    return {
      since,
      label: since ? `Since latest release/tag (${formatDateLabel(since)})` : "All available history"
    };
  }
  const custom = await import_inquirer3.default.prompt([
    {
      type: "input",
      name: "since",
      message: "Start date (YYYY-MM-DD):",
      validate: (value) => {
        const date = new Date(value);
        return !Number.isNaN(date.getTime()) || "Use a valid date, for example 2024-01-01.";
      }
    },
    {
      type: "input",
      name: "until",
      message: "End date (YYYY-MM-DD, optional):",
      validate: (value) => {
        if (!value.trim()) {
          return true;
        }
        const date = new Date(value);
        return !Number.isNaN(date.getTime()) || "Use a valid date, for example 2024-04-23.";
      }
    }
  ]);
  return {
    since: custom.since ? startOfDayIso(new Date(custom.since)) : void 0,
    until: custom.until ? new Date(custom.until).toISOString() : void 0,
    label: "Custom interval"
  };
}
async function resolvePeriod(options, interactive, repo, githubToken) {
  if (options.since || options.until) {
    return {
      since: options.since ? startOfDayIso(new Date(options.since)) : void 0,
      until: options.until ? new Date(options.until).toISOString() : void 0,
      label: "Custom interval"
    };
  }
  if (interactive) {
    return promptForPeriod(repo, githubToken);
  }
  return {
    since: startOfDayIso(subtractDays(/* @__PURE__ */ new Date(), 7)),
    label: "Last 7 days"
  };
}
async function promptForFormat(defaultFormat) {
  const choices = formatChoices.map((formatter) => ({
    name: formatter.label,
    value: formatter.id
  }));
  const savedFormats = getCustomFormats();
  const hasSavedFormats = Object.keys(savedFormats).length > 0;
  if (hasSavedFormats) {
    choices.push({
      name: "\u{1F4C1} My Formats      - Saved custom formats",
      value: "saved"
    });
  }
  const answer = await import_inquirer3.default.prompt([
    {
      type: "list",
      name: "format",
      message: "Which changelog format?",
      default: defaultFormat,
      choices
    }
  ]);
  if (answer.format === "saved") {
    const savedAnswer = await import_inquirer3.default.prompt([
      {
        type: "list",
        name: "savedFormat",
        message: "Which saved format?",
        choices: Object.keys(savedFormats)
      }
    ]);
    return {
      format: "custom",
      prompt: savedFormats[savedAnswer.savedFormat]
    };
  }
  if (answer.format === "custom") {
    const custom = await import_inquirer3.default.prompt([
      {
        type: "input",
        name: "prompt",
        message: "Describe the format you want:",
        validate: (value) => value.trim().length > 0 || "Describe the format first."
      }
    ]);
    return {
      format: "custom",
      prompt: custom.prompt
    };
  }
  return {
    format: answer.format
  };
}
async function resolveFormat(options, interactive, defaultFormat) {
  if (options.format) {
    if (!isSupportedFormat(options.format)) {
      throw new Error(`Unsupported format "${options.format}". Run logit formats list to see options.`);
    }
    return {
      format: options.format,
      prompt: options.prompt
    };
  }
  if (interactive) {
    return promptForFormat(defaultFormat);
  }
  return {
    format: defaultFormat,
    prompt: options.prompt
  };
}
async function resolveLang(options, interactive, defaultLang) {
  if (options.lang) {
    if (!isSupportedLang2(options.lang)) {
      throw new Error("Unsupported language. Use pt-br or en.");
    }
    return options.lang;
  }
  if (!interactive) {
    return defaultLang;
  }
  const answer = await import_inquirer3.default.prompt([
    {
      type: "list",
      name: "lang",
      message: "Output language?",
      default: defaultLang,
      choices: [
        { name: "Portugu\xEAs (pt-br)", value: "pt-br" },
        { name: "English (en)", value: "en" }
      ]
    }
  ]);
  return answer.lang;
}
async function resolveRepo(options, detectedRepo, interactive) {
  if (options.repo) {
    const repo = parseRepoInput(options.repo);
    if (!repo) {
      throw new Error("Invalid repository. Use owner/repo.");
    }
    return {
      ...repo,
      branch: detectedRepo?.branch
    };
  }
  if (detectedRepo && !interactive) {
    return detectedRepo;
  }
  return promptForRepo(detectedRepo?.fullName);
}
async function writeOutput(filePath, content) {
  const resolvedPath = import_node_path2.default.resolve(process.cwd(), filePath);
  await import_promises.default.mkdir(import_node_path2.default.dirname(resolvedPath), { recursive: true });
  await import_promises.default.writeFile(resolvedPath, content, "utf8");
  return resolvedPath;
}
function createGenerateCommand() {
  const command = new import_commander2.Command("generate").description("Generate an AI-powered changelog").option("-r, --repo <owner/repo>", "GitHub repository").option("-s, --since <date>", "start date, for example 2024-01-01").option("-u, --until <date>", "end date, for example 2024-04-23").option("-f, --format <format>", "markdown, discord, twitter, release-notes, email, json, or custom").option("-p, --prompt <prompt>", "custom format prompt").option("-l, --lang <lang>", "pt-br or en").option("-o, --output <path>", "write changelog to a file").option("--copy", "copy generated changelog to clipboard").action(async (options) => {
    const interactive = process.argv.slice(3).length === 0;
    await runGenerate(options, { interactive });
  });
  return command;
}
async function runGenerate(options, runOptions = { interactive: false }) {
  const config = getConfig();
  const groqKey = resolveGroqKey(config);
  const githubToken = resolveGitHubToken(config);
  const defaultLang = config.lang ?? "pt-br";
  const defaultFormat = config.format ?? "markdown";
  if (!isSupportedFormat(defaultFormat)) {
    throw new Error("Stored default format is invalid. Run logit config set format markdown.");
  }
  const detectedRepo = detectGitHubRepo();
  renderSplash(package_default.version, package_default.author);
  const repoFromOption = options.repo ? parseRepoInput(options.repo) : void 0;
  if (options.repo && !repoFromOption) {
    throw new Error("Invalid repository. Use owner/repo.");
  }
  const visibleRepo = repoFromOption ? {
    ...repoFromOption,
    branch: detectedRepo?.branch
  } : detectedRepo;
  if (visibleRepo) {
    renderRepoBox(visibleRepo);
  }
  const repo = await resolveRepo(options, detectedRepo, runOptions.interactive);
  if (!visibleRepo || visibleRepo.fullName !== repo.fullName) {
    renderRepoBox(repo);
  }
  const period = await resolvePeriod(options, runOptions.interactive, repo, githubToken.value);
  const lang = await resolveLang(options, runOptions.interactive, defaultLang);
  const selectedFormat = await resolveFormat(options, runOptions.interactive, defaultFormat);
  if (selectedFormat.format === "custom" && !selectedFormat.prompt) {
    throw new Error("Use --prompt when --format custom is set.");
  }
  if (selectedFormat.prompt) {
    setLastCustomPrompt(selectedFormat.prompt);
  }
  if (!githubToken.value) {
    renderWarning(
      "GitHub token is not configured. Public API limit is 60 requests/hour. For private repos or higher limits, run: logit config set github-token <token>"
    );
  }
  const commitsSpinner = (0, import_ora.default)("Fetching commits via GitHub API...").start();
  const commits = await fetchCommits({
    owner: repo.owner,
    repo: repo.repo,
    since: period.since,
    until: period.until,
    token: githubToken.value
  });
  commitsSpinner.succeed(`${commits.length} commits found`);
  if (commits.length === 0) {
    renderWarning("No commits found for this period.");
  }
  const formatter = formatters[selectedFormat.format];
  const periodText = periodLabel(period);
  const formatDescription = formatter.buildPrompt({
    commits,
    lang,
    repo: repo.fullName,
    period: periodText,
    generatedAt: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10),
    customPrompt: selectedFormat.prompt
  });
  const aiSpinner = (0, import_ora.default)(groqKey.value ? "Generating changelog with Groq AI..." : "Generating changelog with Logit API...").start();
  const changelog = groqKey.value ? await generateChangelogWithGroq({
    apiKey: groqKey.value,
    commits,
    lang,
    formatDescription
  }) : await generateChangelogWithLogitApi({
    commits,
    lang,
    formatDescription
  });
  aiSpinner.succeed("Changelog generated");
  let outputPath;
  if (options.output) {
    outputPath = await writeOutput(options.output, changelog);
  }
  if (options.copy) {
    await import_clipboardy.default.write(changelog);
  }
  renderSuccessBox({
    format: formatter.shortLabel,
    commits: commits.length,
    period: periodText,
    output: outputPath,
    copied: options.copy
  });
  if (!options.output) {
    const shouldRenderMarkdown = selectedFormat.format === "markdown" || selectedFormat.format === "release-notes";
    console.log(import_chalk3.default.cyan("\nGenerated changelog\n"));
    renderOutput(changelog, shouldRenderMarkdown);
  }
}
function handleGenerateError(error) {
  if (error instanceof Error) {
    renderError(error.message);
    return;
  }
  renderError("Unexpected error.");
}

// src/commands/formats.ts
function createFormatsCommand() {
  const command = new import_commander3.Command("formats").description("List and manage saved custom formats");
  command.command("list").description("List built-in and saved formats").action(() => {
    console.log(import_chalk4.default.cyan("Built-in formats"));
    for (const formatter of formatChoices) {
      console.log(`- ${formatter.id.padEnd(13)} ${formatter.description}`);
    }
    const customFormats = getCustomFormats();
    const names = Object.keys(customFormats);
    console.log("");
    console.log(import_chalk4.default.cyan("Saved custom formats"));
    if (names.length === 0) {
      console.log("No saved custom formats yet.");
      return;
    }
    for (const name of names) {
      console.log(`- ${name}`);
    }
  });
  command.command("save").argument("<name>", "name for the saved custom format").option("-p, --prompt <prompt>", "custom prompt to save").description("Save the last custom prompt, or pass one with --prompt").action(async (name, options) => {
    let prompt = options.prompt ?? getLastCustomPrompt();
    if (!prompt) {
      const answer = await import_inquirer4.default.prompt([
        {
          type: "input",
          name: "prompt",
          message: "Describe the custom format to save:",
          validate: (value) => value.trim().length > 0 || "Describe the format first."
        }
      ]);
      prompt = answer.prompt;
    }
    const promptToSave = prompt;
    if (!promptToSave) {
      throw new Error("No custom prompt available to save.");
    }
    saveCustomFormat(name, promptToSave);
    console.log(import_chalk4.default.green(`Saved custom format "${name}".`));
  });
  command.command("delete").argument("<name>", "saved custom format name").description("Delete a saved custom format").action((name) => {
    const deleted = deleteCustomFormat(name);
    if (!deleted) {
      throw new Error(`No saved custom format named "${name}".`);
    }
    console.log(import_chalk4.default.green(`Deleted custom format "${name}".`));
  });
  command.command("use").argument("<name>", "saved custom format name").description("Generate using a saved custom format").action(async (name) => {
    const prompt = getCustomFormat(name);
    if (!prompt) {
      throw new Error(`No saved custom format named "${name}".`);
    }
    await runGenerate(
      {
        format: "custom",
        prompt
      },
      {
        interactive: false
      }
    );
  });
  return command;
}

// src/index.ts
async function main() {
  const program = new import_commander4.Command();
  program.name("logit").description("AI-powered changelog generator for developers").version(package_default.version);
  program.addCommand(createGenerateCommand());
  program.addCommand(createConfigCommand());
  program.addCommand(createFormatsCommand());
  if (process.argv.length <= 2) {
    await runGenerate({}, { interactive: true });
    return;
  }
  await program.parseAsync(process.argv);
}
main().catch((error) => {
  handleGenerateError(error);
  process.exitCode = 1;
});
