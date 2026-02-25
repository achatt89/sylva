# Sylva 🌲

**Auto-generate comprehensive `AGENTS.md` for your repository using Ax-LLM.**

Sylva recursively reads your codebase — folder structures, code conventions, state management patterns, architecture styles — and distills it into a standardized `AGENTS.md` manifest that AI coding assistants (and human engineers) can follow perfectly.

## Why Sylva?

Modern AI coding tools (Cursor, Claude Code, Copilot, Antigravity) perform dramatically better when given explicit project context. Sylva automates the creation of that context by:

1. **Serializing** your entire source tree into a structured format
2. **Analyzing** it with a Reasoning Language Model (RLM) agent
3. **Compiling** the analysis into a standardized 17-section AGENTS.md

## Quick Start

```bash
# Run instantly on any local repository
npx sylva --local-repository /path/to/your/project -m openai/gpt-4o -i 5

# Or analyze a GitHub repository directly
npx sylva --github-repository https://github.com/expressjs/express
```

## What You'll Find Here

| Section | Description |
|---------|-------------|
| [Getting Started](getting-started/installation.md) | Installation, configuration, and your first run |
| [Core Concepts](concepts/pipeline.md) | How the pipeline works under the hood |
| [Models & Providers](models/supported.md) | Supported LLMs and how to choose the right one |
| [CLI Reference](cli/commands.md) | Every flag, environment variable, and exit code |
| [Output Format](output/sections.md) | What AGENTS.md contains and how to customize it |
| [Advanced Usage](advanced/monorepo.md) | Monorepos, CI/CD, and troubleshooting |
| [Architecture](architecture/internals.md) | Internal code architecture for contributors |
| [Contributing](contributing/setup.md) | Development setup, code quality, and PR guidelines |
