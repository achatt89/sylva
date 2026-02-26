# Iteration Depth Guide

The `-i` (or `--max-iterations`) flag is Sylva's most important tuning parameter. It controls how many times the RLM agent can execute JavaScript snippets to search and analyze your serialized source tree.

## What Happens During Each Iteration

Each iteration, the RLM agent:

1. Decides what to investigate next (e.g., "What's in the `backend/` directory?")
2. Writes a JavaScript snippet to search the context
3. Executes the snippet against the serialized source tree
4. Reads the results and updates its understanding

**Example iteration trace (simplified):**

```
Iteration 1: Scan top-level structure → finds frontend/, backend/, tests/
Iteration 2: Read requirements.txt → identifies FastAPI, uvicorn, pydantic
Iteration 3: Read package.json → identifies React, Tailwind CSS
Iteration 4: Scan backend/server.py imports → confirms FastAPI routes
Iteration 5: Scan frontend/src/ → identifies context providers, hooks
Iteration 6: Look for test files → finds Pytest config
Iteration 7: Read Dockerfile → confirms deployment strategy
...
```

## Recommended Iterations by Project Size

| Files in Repo | Stacks | Recommended `-i` | Rationale |
|---|---|---|---|
| 1-20 | Single | `1` | Everything fits in one context read |
| 20-50 | Single | `3-5` | Needs a few passes for subdirectories |
| 50-100 | Single | `5-10` | Deeper traversal of nested modules |
| 50-100 | Multi-stack | `10-15` | Must traverse both stacks thoroughly |
| 100-300 | Multi-stack | `15-25` | Complex cross-stack dependencies |
| 300+ | Multi-stack | `25-35` | Maximum depth for enterprise repos |

## The Tradeoff Triangle

```
       Quality
        /\
       /  \
      /    \
     /      \
    /________\
  Cost       Time
```

- **More iterations → Higher quality** (the AI sees more code)
- **More iterations → Higher cost** (each iteration is an LLM call)
- **More iterations → Longer runtime** (each iteration takes 2-10 seconds)

## Common Pitfalls

### Too Few Iterations

**Symptom:** Output is generic, misses subdirectory contents, or says "not evidenced" for things that clearly exist.

**Fix:** Increase `-i`. The AI simply didn't have enough iterations to traverse into deeper directories.

### Too Many Iterations

**Symptom:** The AI starts analyzing its own runtime code, produces circular analysis, or output quality degrades.

**Fix:** Reduce `-i`. At very high iteration counts (e.g., 50+), the RLM agent may run out of meaningful work and start analyzing artefacts of the JavaScript runtime itself.

### Wrong Model + High Iterations

**Symptom:** Mini models with high iterations produce worse results than primary models with fewer iterations.

**Fix:** Use a primary-tier model (`gpt-4o`, `gpt-5.2`, `claude-sonnet-4.6`) for the analysis. Sylva now does this automatically — the primary model handles analysis while the mini model only handles section extraction.

## Practical Examples

```bash
# Small Python library
npx @thelogicatelier/sylva --local-repository ./my-click-plugin -m openai/gpt-4o -i 1

# Standard React app
npx @thelogicatelier/sylva --local-repository ./my-react-app -m openai/gpt-4o -i 5

# Full-stack monorepo (React + FastAPI + Docker)
npx @thelogicatelier/sylva --local-repository ./my-fullstack-app -m openai/gpt-5.2 -i 25

# Enterprise microservices
npx @thelogicatelier/sylva --local-repository ./enterprise -m anthropic/claude-sonnet-4.6 -i 35
```
