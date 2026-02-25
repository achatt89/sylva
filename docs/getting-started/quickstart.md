# Quick Start

This guide walks you through generating your first `AGENTS.md` file in under 2 minutes.

## Prerequisites

- Node.js v18+ installed
- At least one API key configured (see [Configuration](configuration.md))

## Step 1: Run Sylva

```bash
# Navigate to any repository on your machine
cd /path/to/your/project

# Run Sylva (using OpenAI as an example)
npx sylva --local-repository . -m openai/gpt-4o -i 5
```

## Step 2: Watch the Pipeline

You'll see Sylva's 3-stage pipeline in action:

```
Using provider: openai | Primary: openai/gpt-4o | Mini: openai/gpt-4o-mini

======================================================
🕵️‍♂️    SYLVA / AGENTS.md Generator Pipeline
======================================================

✅ Extracted representation for 14 top-level file(s)/directory(ies).
=> Preparing and serializing Source Tree for RLM analysis...
=> Running AxAgent (RLM) for Codebase Analysis on 14 root modules...
=> Running the Codebase Analyzer RLM workflow...
=> Compiling Codebase Analysis into Cohesive Markdown...
=> Extracting individual AGENTS.md sections for repository: my-project...
✅ Successfully saved AGENTS.md to: projects/my-project/AGENTS.md

======================================================
🎉  AGENTS.md Generation Complete!
======================================================
```

## Step 3: Review the Output

The generated file is saved to `projects/<repo-name>/AGENTS.md`. Open it:

```bash
cat projects/my-project/AGENTS.md
```

You'll find a comprehensive document with 17 sections covering:

- **Project Overview** — What the project does and its sub-services
- **Tech Stack** — Every language, framework, library, and external API
- **Architecture** — ASCII diagram with directory layout and module responsibilities
- **Code Style** — Naming conventions, formatting rules, and import patterns
- **Testing** — Commands to run and frameworks used
- **Security** — Compliance rules and secret management
- And 11 more sections (see [Output Sections](../output/sections.md))

## Step 4: Use It

Copy the generated `AGENTS.md` into your project root:

```bash
cp projects/my-project/AGENTS.md /path/to/your/project/AGENTS.md
```

AI coding tools will automatically pick up this file and use it to generate more accurate, project-aware code.

## Example: Analyzing a GitHub Repository

You don't need to clone a repo first. Sylva can fetch it directly:

```bash
npx sylva --github-repository https://github.com/pallets/flask -m openai/gpt-4o -i 5
```

Sylva will shallow-clone the repo into a temp directory, analyze it, save the output, and clean up automatically.

## What's Next?

- [Understand how the pipeline works](../concepts/pipeline.md)
- [Choose the right model and iteration count](../models/choosing.md)
- [Analyze complex monorepos](../advanced/monorepo.md)
