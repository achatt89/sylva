# How Sylva Works

Sylva generates `AGENTS.md` through a multi-stage pipeline powered by Ax-LLM. Each stage progressively refines raw source code into a structured, AI-readable manifest.

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
  │   Framework       │   2. runAwareness() deterministically scans
  │   Awareness       │      ALL manifest files (nested + monorepo),
  │   (Deterministic) │      detects frameworks/versions, builds
  │                   │      ARCHITECTURE CONSTRAINTS block
  └────────┬─────────┘
           │
           v
  ┌──────────────────┐
  │   RLM Codebase   │   3. AxAgent with RLM iterates over the serialized
  │   Analysis       │      context using JavaScript runtime, extracting
  │   (Primary Model)│      17 structured fields (tech stack, architecture,
  │                   │      code style, patterns, etc.)
  └────────┬─────────┘
           │
           v
  ┌──────────────────┐
  │   Conventions    │   4. Chain-of-Thought agent compiles the 17 fields
  │   Compilation    │      into a cohesive markdown document
  │   (Primary Model)│
  └────────┬─────────┘
           │
           v
  ┌──────────────────┐
  │   Section        │   5. Final extraction splits the markdown into
  │   Extraction     │      the 17 AGENTS.md sections with proper headers
  │   (Mini Model)   │
  └────────┬─────────┘
           │
           v
  ┌──────────────────┐
  │   AGENTS.md      │   6. Saved to projects/<repo-name>/AGENTS.md
  │   Output         │      + awareness.json for debugging
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

## Stage 2: Framework Awareness (NEW)

**File:** `src/awareness/index.ts` → `runAwareness()`

Before any LLM is invoked, Sylva deterministically scans the entire repository for manifest files and builds authoritative framework constraints. This stage runs without any API calls and prevents the LLM from hallucinating frameworks.

**Sub-steps:**
1. **Manifest Scanning** — Recursively walks the repo, identifying ~30 manifest file patterns (`package.json`, `pom.xml`, `go.mod`, `Cargo.toml`, `openclaw.json`, etc.) at any depth
2. **Signal Extraction** — Each manifest is parsed by specialized parsers that emit framework, version, tooling, and orchestrator signals with evidence
3. **Version Resolution** — Consolidates version signals per framework using `exact > ambiguous > unknown` priority
4. **Stack Detection** — Groups signals into stacks with confidence scores and scopes them to their subproject paths
5. **Architecture Model** — Detects monorepo structure, orchestrators (OpenClaw), and workloads
6. **Web Grounding** (optional) — If `BRAVE_API_KEY` is set, fetches version-specific official documentation. If not set, this step is gracefully skipped
7. **Constraints Block** — Builds the `ARCHITECTURE CONSTRAINTS (AUTHORITATIVE)` text that is injected into all three LLM steps

**Key principle:** Versions are only reported when explicitly found in manifest/lockfiles. The system NEVER assumes a version.

## Stage 3: RLM Codebase Analysis

**File:** `src/modules.ts` → `CodebaseConventionExtractor`

The serialized tree — prepended with ARCHITECTURE CONSTRAINTS from Stage 2 — is passed to an `AxAgent` configured as a **Reasoning Language Model (RLM)**. The RLM agent uses a JavaScript runtime to iteratively search and analyze the context over multiple passes (controlled by the `-i` flag).

This stage uses the **primary model** (e.g., `gpt-4o`, `gpt-5.2`) for strong reasoning capabilities. It extracts 17 structured fields including project overview, tech stack, directory structure, architecture patterns, code style, and more. The `awarenessContext` is passed as an explicit input to enforce the constraints.

See [RLM Agent](rlm.md) for a deep dive.

## Stage 4: Conventions Compilation

**File:** `src/modules.ts` → `compileMarkdown()`

A standard Chain-of-Thought agent takes the 17 extracted fields and the `awarenessContext` and compiles them into a single, cohesive Markdown document. This stage also uses the **primary model** to ensure accurate synthesis. The output is mandated to align with the ARCHITECTURE CONSTRAINTS.

## Stage 5: Section Extraction

**File:** `src/modules.ts` → `AgentsMdCreator`

The compiled Markdown and `awarenessContext` are passed to a final Chain-of-Thought agent that splits it into the 17 standardized AGENTS.md sections with proper headers. This stage uses the **mini model** (e.g., `gpt-4o-mini`) since it's a simpler, more deterministic task.

## Dual-Model Architecture

Sylva uses **two model instances** to optimize for both quality and cost:

| Stage | Model Tier | Rationale |
|-------|-----------|-----------|
| Framework Awareness | **None** (deterministic) | No AI needed — scans manifests directly |
| RLM Analysis | **Primary** (e.g., `gpt-4o`) | Needs strong reasoning to avoid hallucination |
| Conventions Compilation | **Primary** | Must accurately synthesize complex analysis |
| Section Extraction | **Mini** (e.g., `gpt-4o-mini`) | Simple formatting task, cheaper and faster |

When you specify `-m openai/gpt-4o`, Sylva automatically selects `gpt-4o-mini` as the mini model for that provider.
