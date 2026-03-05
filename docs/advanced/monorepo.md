# Monorepo Analysis

Monorepos — repositories containing multiple sub-projects (e.g., frontend + backend + shared libraries) — are Sylva's most challenging use case. This guide covers strategies for getting the best results.

## Framework Awareness (NEW)

Sylva now includes **deterministic monorepo support** through the Framework Awareness system. Before any LLM is invoked, it:

1. **Scans the entire repo** for manifest files at any depth (`package.json`, `pom.xml`, `go.mod`, etc.)
2. **Scopes each detection** to its subproject path (e.g., `frontend/package.json` → Angular at `frontend/`)
3. **Detects monorepo structure** automatically when frameworks are found at multiple distinct paths
4. **Builds workloads** per subproject with their frameworks, entrypoints, and build tools
5. **Injects ARCHITECTURE CONSTRAINTS** into the LLM prompt so it cannot conflate stacks

Example output for a monorepo with Angular frontend + FastAPI backend + Spring Boot service:

```
🔍 Running Framework Awareness scan...
  → Found 6 manifest file(s)
    📄 package.json (depth: 0)
    📄 frontend/package.json (depth: 1)
    📄 frontend/angular.json (depth: 1)
    📄 services/api/pyproject.toml (depth: 2)
    📄 services/core/pom.xml (depth: 2)
  → Detected 6 stack(s), repo type: monorepo
    🏗️  Spring Boot v3.2.1 (exact) [confidence: 90%]
    🏗️  Angular v17.2.0 (exact) [confidence: 85%]
    🏗️  FastAPI v0.109.0 (exact) [confidence: 80%]
```

This completely eliminates the "multi-stack confusion" problem described below.

## Challenges

1. **Large file count:** More files = more context for the AI to process
2. **Multi-stack confusion:** The AI may conflate frontend and backend technologies *(now mitigated by Framework Awareness)*
3. **Iteration depth:** The RLM agent needs enough iterations to traverse all subtrees
4. **Manifest ambiguity:** Multiple `package.json` files at different levels *(now deterministically resolved by awareness)*

## Recommended Configuration

```bash
npx @thelogicatelier/sylva --local-repository . -m openai/gpt-5.2 -i 25
```

**Why `gpt-5.2`?** It has stronger reasoning capabilities than `gpt-4o` and handles cross-stack detection better. For maximum accuracy, use `anthropic/claude-sonnet-4.6`.

**Why `-i 25`?** The agent needs roughly:
- 3-5 iterations for top-level structure
- 5-8 iterations for the frontend subtree
- 5-8 iterations for the backend subtree
- 3-5 iterations for tests, config, and deployment files

## How Manifest Hoisting Helps

Sylva automatically hoists dependency manifests (`requirements.txt`, `package.json`, `Cargo.toml`, etc.) to the top of the serialized context. This means:

- `backend/requirements.txt` (declaring `fastapi`) is read **before** any JavaScript files
- `frontend/package.json` (declaring `react`) is read **before** any Python files
- The AI forms correct first impressions about each stack

## Real-World Example

**Project: `myshabeauty`** — A React/Tailwind frontend with Python FastAPI backend, Wix API + Instagram Graph API integrations, and Fly.io deployment.

```bash
npx @thelogicatelier/sylva --local-repository /path/to/myshabeauty -m openai/gpt-5.2 -i 25
```

This correctly identified:
- ✅ React + Tailwind CSS + CRACO (frontend)
- ✅ Python + FastAPI (backend) — NOT Express.js
- ✅ Wix APIs + Instagram Graph API (integrations)
- ✅ Docker + Fly.io (deployment)
- ✅ Pytest (testing)
- ✅ Context API for state management (AuthContext, CartContext)

## Tips for Better Results

1. **Clean up before scanning:** Remove generated files, caches, and build artefacts. Ensure `.gitignore` patterns match what Sylva ignores.
2. **Check the file count:** Sylva reports "Extracted representation for N top-level file(s)/directory(ies)". If N is low, important directories may be filtered out.
3. **Increase iterations for deep nesting:** Projects with deeply nested directories (e.g., `src/modules/auth/providers/google/`) need more iterations.
4. **Review and iterate:** Generate once, review the output, and if specific areas are weak, consider modifying the prompts (see [Customizing Output](../output/customizing.md)).
5. **Check `awareness.json`:** After running, inspect `projects/<repo>/awareness.json` to verify which frameworks, versions, and workloads were detected before the LLM was invoked.
