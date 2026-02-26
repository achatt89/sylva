# RLM (Reasoning Language Model) Agent

The RLM agent is the core intelligence behind Sylva's codebase analysis. It uses Ax-LLM's `AxAgent` with a JavaScript runtime to iteratively search and analyze your serialized source tree.

## What is RLM?

RLM (Reasoning Language Model) is a technique where the LLM is given:

1. A **large context** (your serialized source tree)
2. A **JavaScript runtime** for executing search/analysis code
3. A **fixed number of iterations** to explore the context

Instead of processing the entire context in one pass, the RLM agent writes and executes JavaScript snippets to search for specific patterns, read specific files, and build its understanding incrementally.

## How It Works in Sylva

```text
┌─────────────────────────────────────┐
│           AxAgent (RLM)             │
│                                     │
│  Iteration 1: "What languages are   │
│  used? Let me search for imports..." │
│  → executes JS to scan context      │
│                                     │
│  Iteration 2: "I found Python and   │
│  React. What frameworks? Let me     │
│  check requirements.txt..."         │
│  → executes JS to find dependencies │
│                                     │
│  Iteration 3: "FastAPI found. What  │
│  about the frontend build tool?"    │
│  → executes JS to check package.json│
│                                     │
│  ... (up to maxIterations)          │
│                                     │
│  Final: Outputs 17 structured fields│
└─────────────────────────────────────┘
```

## The `-i` Flag (Max Iterations)

The `-i` or `--max-iterations` flag controls how many times the RLM agent can iterate:

```bash
# Default: 35 iterations
npx @thelogicatelier/sylva --local-repository . -m openai/gpt-4o

# Explicit: 25 iterations (good for large repos)
npx @thelogicatelier/sylva --local-repository . -m openai/gpt-4o -i 25

# Minimal: 1 iteration (fast but shallow)
npx @thelogicatelier/sylva --local-repository . -m openai/gpt-4o -i 1
```

**More iterations = deeper analysis** but also:
- Higher API costs (more LLM calls)
- Longer execution time
- Diminishing returns beyond a certain depth

See [Iteration Depth Guide](../models/iterations.md) for recommended values.

## The 17 Extracted Fields

The RLM agent extracts these structured fields from your codebase:

| # | Field | Description |
|---|-------|-------------|
| 1 | `projectOverview` | Purpose, sub-services, languages |
| 2 | `techStack` | Every framework, library, database, API |
| 3 | `directoryStructure` | Full directory tree with responsibilities |
| 4 | `executionCommands` | Build, run, and test commands |
| 5 | `codeStyleAndFormatting` | Naming conventions, linting rules |
| 6 | `architectureAndDesignPatterns` | System design, API boundaries |
| 7 | `antiPatternsAndRestrictions` | What NOT to do |
| 8 | `dependencyManagement` | How deps are managed |
| 9 | `stateManagementGuidelines` | State patterns (Redux, Context, etc.) |
| 10 | `databaseAndDataHandling` | DB tech, schemas, ORM patterns |
| 11 | `errorHandlingAndLogging` | Error strategies, logging libraries |
| 12 | `testingStrategy` | Test frameworks, conventions |
| 13 | `securityAndCompliance` | Auth patterns, secret management |
| 14 | `gitAndVersionControl` | Branching, commit conventions |
| 15 | `documentationStandards` | Doc formatting rules |
| 16 | `agentWorkflow` | Step-by-step SOP for AI agents |
| 17 | `fewShotExamples` | Concrete good/bad code examples |

## Anti-Hallucination Safeguards

The RLM agent is explicitly instructed to:

- **Never guess** frameworks based on the presence of a `package.json`
- **Scan actual imports** in `.py`, `.ts`, `.js` files
- **Read dependency manifests** (`requirements.txt`, `go.mod`, `Cargo.toml`)
- **Verify before asserting** — if evidence is not found, say so

This prevents common hallucinations like identifying "Express.js" when the backend is actually FastAPI.
