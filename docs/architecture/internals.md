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
│   ├── index.ts         # Package entry point (re-exports)
│   └── awareness/       # Framework Awareness (deterministic detection)
│       ├── index.ts           # Orchestrator: scan → parse → resolve → detect → ground
│       ├── types.ts           # Shared interfaces (Signal, StackInfo, ArchitectureModel, etc.)
│       ├── manifestScanner.ts # Full-repo recursive manifest file discovery
│       ├── versionResolver.ts # Version consolidation (exact > ambiguous > unknown)
│       ├── detector.ts        # Stack detection + architecture model builder
│       ├── braveSearch.ts     # Brave Search API client with disk caching
│       ├── webGrounding.ts    # Version-aware query builder + reference gatherer
│       └── manifestParsers/   # Specialized parsers per manifest type
│           ├── index.ts            # Dispatcher (routes files to parsers)
│           ├── openclawParser.ts   # openclaw.json → orchestrator signals
│           ├── packageJsonParser.ts # package.json → JS/TS framework signals
│           ├── pythonParsers.ts    # requirements.txt, pyproject.toml, Pipfile, setup.cfg
│           ├── javaParsers.ts      # pom.xml, build.gradle
│           ├── dotnetParsers.ts    # *.csproj, global.json
│           ├── goParsers.ts        # go.mod
│           └── rustParsers.ts      # Cargo.toml
├── tests/
│   └── src/
│       ├── modelConfig.test.ts
│       ├── utils.test.ts
│       ├── cli.test.ts
│       └── awareness/             # 9 test files for awareness modules
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
       ├─ runAwareness()         [awareness/index.ts]
       │    ├─ scanManifests()       → ManifestFile[] (full-repo scan)
       │    ├─ parseAllManifests()   → Signal[] (framework/version/tooling)
       │    ├─ resolveAllVersions()  → Map<frameworkId, VersionInfo>
       │    ├─ detectStacks()        → StackInfo[] (with confidence scores)
       │    ├─ detectArchitecture()  → ArchitectureModel (orchestrator + workloads)
       │    ├─ gatherReferences()    → WebReference[] (optional, needs BRAVE_API_KEY)
       │    └─ buildConstraintsBlock() → ARCHITECTURE CONSTRAINTS text
       │         Outputs: AwarenessResult + awareness.json
       │
       ├─ CodebaseConventionExtractor.extract()   [modules.ts]
       │    ├─ serializeSourceTree()              → Markdown string
       │    ├─ Prepend awarenessContext to context
       │    └─ AxAgent (RLM) with JSRuntime       → 17 structured fields
       │         Uses: CODEBASE_ANALYSIS_SIGNATURE [prompts.ts]
       │         Input: sourceContext + awarenessContext
       │         Model: PRIMARY
       │
       ├─ CodebaseConventionExtractor.compileMarkdown()  [modules.ts]
       │    └─ ax(COMPILE_CONVENTIONS_SIGNATURE)  → Cohesive markdown
       │         Input: 17 fields + awarenessContext
       │         Model: PRIMARY
       │
       ├─ AgentsMdCreator.extractAndCompileSections()    [modules.ts]
       │    └─ ax(EXTRACT_AGENTS_SECTIONS_SIGNATURE) → 17 typed sections
       │         Input: conventionsMarkdown + repositoryName + awarenessContext
       │         Model: MINI
       │
       └─ assembleAgentsMd() + saveAgentsMd()    [utils.ts]
            → projects/<repo>/AGENTS.md
            → projects/<repo>/awareness.json
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

### 6. Deterministic Framework Awareness (NEW)
The awareness pipeline runs **before** any LLM calls, using only filesystem operations to detect frameworks. This prevents the LLM from hallucinating frameworks (e.g., generating a JS project for an OpenClaw config repo). The ARCHITECTURE CONSTRAINTS block is injected into all three LLM prompt signatures so the AI cannot contradict the detected evidence. Web grounding via Brave Search is optional — if `BRAVE_API_KEY` is not set, all deterministic detection still works perfectly.
