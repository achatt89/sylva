# How Sylva Works

Sylva generates `AGENTS.md` through a 3-stage pipeline powered by Ax-LLM. Each stage progressively refines raw source code into a structured, AI-readable manifest.

## Pipeline Overview

```text
  ┌──────────────────┐
  │   Source Tree     │   1. loadSourceTree() recursively reads your repo
  │   Serialization   │      Filters by extension, skips ignored dirs,
  │                   │      hoists dependency manifests to the top
  └────────┬─────────┘
           │
           v
  ┌──────────────────┐
  │   RLM Codebase   │   2. AxAgent with RLM iterates over the serialized
  │   Analysis       │      context using JavaScript runtime, extracting
  │   (Primary Model)│      17 structured fields (tech stack, architecture,
  │                   │      code style, patterns, etc.)
  └────────┬─────────┘
           │
           v
  ┌──────────────────┐
  │   Conventions    │   3. Chain-of-Thought agent compiles the 17 fields
  │   Compilation    │      into a cohesive markdown document
  │   (Primary Model)│
  └────────┬─────────┘
           │
           v
  ┌──────────────────┐
  │   Section        │   4. Final extraction splits the markdown into
  │   Extraction     │      the 17 AGENTS.md sections with proper headers
  │   (Mini Model)   │
  └────────┬─────────┘
           │
           v
  ┌──────────────────┐
  │   AGENTS.md      │   5. Saved to projects/<repo-name>/AGENTS.md
  │   Output         │
  └──────────────────┘
```

## Stage 1: Source Tree Serialization

**File:** `src/utils.ts` → `loadSourceTree()`

Sylva recursively walks your repository and builds a nested dictionary of all source files. Key behaviors:

- **Allowed extensions:** `.py`, `.js`, `.ts`, `.jsx`, `.tsx`, `.java`, `.go`, `.rs`, `.rb`, `.php`, `.sql`, `.md`, `.json`, `.yml`, `.yaml`, `.html`, `.css`, and 25+ more
- **Ignored directories:** `node_modules`, `__pycache__`, `venv`, `dist`, `build`, `target`, `.git`, and 12+ more
- **File size limit:** Files over 500,000 characters are skipped
- **Manifest hoisting:** Dependency files (`requirements.txt`, `pyproject.toml`, `go.mod`, `Cargo.toml`, `package.json`, `Dockerfile`, etc.) are placed **first** in the serialized output so the AI reads them before any source code

The serialized tree is formatted as Markdown with code fences:

```markdown
- File: requirements.txt
  Content:
  ```
  fastapi==0.110.1
  uvicorn==0.25.0
  ```

- Directory: backend/
  - File: server.py
    Content:
    ```python
    from fastapi import FastAPI
    ...
    ```
```

## Stage 2: RLM Codebase Analysis

**File:** `src/modules.ts` → `CodebaseConventionExtractor`

The serialized tree is passed to an `AxAgent` configured as a **Reasoning Language Model (RLM)**. The RLM agent uses a JavaScript runtime to iteratively search and analyze the context over multiple passes (controlled by the `-i` flag).

This stage uses the **primary model** (e.g., `gpt-4o`, `gpt-5.2`) for strong reasoning capabilities. It extracts 17 structured fields including project overview, tech stack, directory structure, architecture patterns, code style, and more.

See [RLM Agent](rlm.md) for a deep dive.

## Stage 3: Conventions Compilation

**File:** `src/modules.ts` → `compileMarkdown()`

A standard Chain-of-Thought agent takes the 17 extracted fields and compiles them into a single, cohesive Markdown document. This stage also uses the **primary model** to ensure accurate synthesis.

## Stage 4: Section Extraction

**File:** `src/modules.ts` → `AgentsMdCreator`

The compiled Markdown is passed to a final Chain-of-Thought agent that splits it into the 17 standardized AGENTS.md sections with proper headers. This stage uses the **mini model** (e.g., `gpt-4o-mini`) since it's a simpler, more deterministic task.

## Dual-Model Architecture

Sylva uses **two model instances** to optimize for both quality and cost:

| Stage | Model Tier | Rationale |
|-------|-----------|-----------|
| RLM Analysis | **Primary** (e.g., `gpt-4o`) | Needs strong reasoning to avoid hallucination |
| Conventions Compilation | **Primary** | Must accurately synthesize complex analysis |
| Section Extraction | **Mini** (e.g., `gpt-4o-mini`) | Simple formatting task, cheaper and faster |

When you specify `-m openai/gpt-4o`, Sylva automatically selects `gpt-4o-mini` as the mini model for that provider.
