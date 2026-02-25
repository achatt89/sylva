# Monorepo Analysis

Monorepos — repositories containing multiple sub-projects (e.g., frontend + backend + shared libraries) — are Sylva's most challenging use case. This guide covers strategies for getting the best results.

## Challenges

1. **Large file count:** More files = more context for the AI to process
2. **Multi-stack confusion:** The AI may conflate frontend and backend technologies
3. **Iteration depth:** The RLM agent needs enough iterations to traverse all subtrees
4. **Manifest ambiguity:** Multiple `package.json` files at different levels can confuse the AI

## Recommended Configuration

```bash
npx sylva --local-repository . -m openai/gpt-5.2 -i 25
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
npx sylva --local-repository /path/to/myshabeauty -m openai/gpt-5.2 -i 25
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
