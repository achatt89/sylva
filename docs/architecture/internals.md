# Internal Architecture

This page documents Sylva's internal code architecture for contributors and advanced users.

## Module Map

```text
sylva/
├── src/
│   ├── cli.ts           # Entry point, CLI argument parsing, pipeline orchestration
│   ├── constants.ts     # Model catalog, provider constants, file extension lists
│   ├── modelConfig.ts   # Model resolution and LLM instance creation
│   ├── modules.ts       # AxAgent wrappers (RLM analysis, conventions compilation, section extraction)
│   ├── prompts.ts       # Prompt signatures, agent identity, output field definitions
│   ├── utils.ts         # Source tree loading, file I/O, AGENTS.md assembly
│   └── index.ts         # Package entry point (re-exports)
├── tests/
│   └── src/
│       └── modelConfig.test.ts   # Unit tests for model resolution
├── docs/                # HonKit documentation (this site)
└── dist/                # Compiled JavaScript output
```

## Data Flow

```text
cli.ts
  │
  ├─ initEnvironment()          Load .env from cwd
  ├─ resolveModelConfig()       Determine provider, primary & mini models
  ├─ getLanguageModelService()  Create Ax-LLM instances
  │
  └─ runPipeline()
       │
       ├─ loadSourceTree()       [utils.ts]    → { [filename]: content }
       │    └─ Hoists dependency manifests to top
       │
       ├─ CodebaseConventionExtractor.extract()   [modules.ts]
       │    ├─ serializeSourceTree()              → Markdown string
       │    └─ AxAgent (RLM) with JSRuntime       → 17 structured fields
       │         Uses: CODEBASE_ANALYSIS_SIGNATURE [prompts.ts]
       │         Model: PRIMARY
       │
       ├─ CodebaseConventionExtractor.compileMarkdown()  [modules.ts]
       │    └─ ax(COMPILE_CONVENTIONS_SIGNATURE)  → Cohesive markdown
       │         Model: PRIMARY
       │
       ├─ AgentsMdCreator.extractAndCompileSections()    [modules.ts]
       │    └─ ax(EXTRACT_AGENTS_SECTIONS_SIGNATURE) → 17 typed sections
       │         Model: MINI
       │
       └─ assembleAgentsMd() + saveAgentsMd()    [utils.ts]
            → projects/<repo>/AGENTS.md
```

## Key Design Decisions

### 1. Dual-Model Strategy
The primary model handles accuracy-critical tasks (RLM analysis, compilation). The mini model handles cheap, deterministic tasks (section extraction). This reduces API costs by ~40% without sacrificing quality.

### 2. Dependency Manifest Hoisting
Dependency files are reordered to the top of the serialized tree. This ensures the AI reads `requirements.txt` or `package.json` before forming assumptions about the tech stack, dramatically reducing hallucination.

### 3. AxAgent RLM Architecture
Instead of a simple prompt → response flow, the RLM agent iteratively explores the source context using JavaScript snippets. This allows it to handle repositories too large for a single context window.

### 4. Typed Prompt Signatures
Using Ax-LLM's `f()` builder creates type-safe prompt signatures. Each output field has a descriptive prompt that explicitly instructs the AI on what to extract, preventing vague or generic output.

### 5. Process Exit
`process.exit(0)` is called after pipeline completion because Ax-LLM's HTTP connections keep Node.js alive indefinitely otherwise.
