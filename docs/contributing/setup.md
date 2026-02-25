# Development Setup

This guide covers setting up a local development environment for contributing to Sylva.

## Prerequisites

- Node.js v18+
- npm v8+
- Git
- An API key from at least one supported provider (OpenAI, Anthropic, or Google Gemini)

## Clone and Install

```bash
git clone https://github.com/achatt89/sylva.git
cd sylva
npm install
```

## Configure Environment

```bash
cp .env-example .env
# Edit .env and add your API key(s)
```

## Build

```bash
npm run build
```

This compiles TypeScript from `src/` into `dist/` using `tsc`.

## Run from Source

```bash
# Using npm start
npm start -- --local-repository /path/to/project -m openai/gpt-4o -i 5

# Or directly via the compiled binary
./dist/cli.js --local-repository /path/to/project -m openai/gpt-4o -i 5
```

## Run Tests

```bash
npm test
```

Tests use [Vitest](https://vitest.dev/) and are located in `tests/src/`. They mirror the `src/` directory structure.

## Project Layout

```
sylva/
├── src/                # TypeScript source
│   ├── cli.ts          # CLI entry point
│   ├── constants.ts    # Model catalog, extensions, ignored dirs
│   ├── modelConfig.ts  # Model resolution
│   ├── modules.ts      # AxAgent wrappers
│   ├── prompts.ts      # Prompt signatures
│   ├── utils.ts        # Source tree loading, file I/O
│   └── index.ts        # Package entry
├── tests/
│   └── src/            # Test files (mirrors src/)
├── docs/               # HonKit documentation
├── dist/               # Compiled output (gitignored)
├── .github/workflows/  # CI/CD
├── .husky/             # Git hooks
├── package.json
├── tsconfig.json
└── eslint.config.mjs
```

## Local Pack and Test

To test your changes in another project:

```bash
# Build and pack
npm run build && npm pack

# Install the local tarball in your test project
cd /path/to/test-project
npm install /path/to/sylva/sylva-x.x.x.tgz

# Run it
npx sylva --local-repository . -m openai/gpt-4o -i 5
```
