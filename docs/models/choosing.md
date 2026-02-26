# Choosing the Right Model

Choosing the right model and iteration count is the single biggest factor affecting output quality. This guide provides battle-tested recommendations based on real-world usage.

## Decision Matrix

| Project Type | Example | Recommended Model | Iterations (`-i`) | Est. Cost | Est. Time |
|---|---|---|---|---|---|
| Small library (<20 files) | `pallets/click`, `lodash` | `openai/gpt-4o` | `1` | ~$0.05 | <30s |
| Medium application (20-100 files) | `expressjs/express`, `fastify` | `openai/gpt-4o` | `5` | ~$0.20 | 1-2 min |
| Large application (100-500 files) | Single-stack web apps | `openai/gpt-4o` | `10-15` | ~$0.50 | 3-5 min |
| Monorepo (multi-stack) | React + Python + APIs | `openai/gpt-5.2` | `25` | ~$1.50 | 5-10 min |
| Enterprise codebase (500+ files) | Microservices, large orgs | `anthropic/claude-sonnet-4.6` | `35` | ~$3.00 | 10-15 min |

## Why These Recommendations?

### Small Libraries (`-i 1`)

For projects with fewer than 20 files, the entire source tree fits comfortably in a single LLM context window. One iteration is enough because the AI can see everything at once.

```bash
npx @thelogicatelier/sylva --github-repository https://github.com/pallets/click -m openai/gpt-4o -i 1
```

### Medium Applications (`-i 5`)

At 20-100 files, the RLM agent needs a few passes to traverse nested directories and cross-reference imports with dependency files. Five iterations lets it scan the top-level structure, then drill into 3-4 key subdirectories.

```bash
npx @thelogicatelier/sylva --local-repository ./my-express-app -m openai/gpt-4o -i 5
```

### Large Monorepos (`-i 25`)

This is where model choice matters most. Multi-stack repos (e.g., React frontend + Python FastAPI backend + Wix API integration) require:
- Many iterations to traverse both the frontend and backend subtrees
- A strong reasoning model to avoid hallucinating frameworks

**Real-world example: `myshabeauty`** — a React/Tailwind frontend with a Python FastAPI backend, Wix API integration, and Fly.io deployment:

```bash
npx @thelogicatelier/sylva --local-repository . -m openai/gpt-5.2 -i 25
```

This produced a detailed `AGENTS.md` correctly identifying:
- React + Tailwind CSS + CRACO (frontend)
- Python + FastAPI (backend)
- Wix APIs + Instagram Graph API (integrations)
- Docker + Fly.io (deployment)
- Pytest (testing)
- Context API for state management

### Enterprise Codebases (`-i 35`)

The default iteration count of 35 is designed for the largest repositories. Use Anthropic's Claude Sonnet for its massive context window and strong instruction-following.

```bash
npx @thelogicatelier/sylva --local-repository ./enterprise-monorepo -m anthropic/claude-sonnet-4.6 -i 35
```

## Model Comparison: When to Use What

### OpenAI `gpt-4o` — The Workhorse
- **Best for:** Most projects, predictable costs
- **Strengths:** Fast, reliable, good balance of accuracy and cost
- **Weaknesses:** May need more iterations for very large repos

### OpenAI `gpt-5.2` — The Powerhouse
- **Best for:** Complex monorepos, multi-stack architectures
- **Strengths:** Superior reasoning, handles cross-stack detection well
- **Weaknesses:** Higher cost per token

### Anthropic `claude-sonnet-4.6` — The Deep Thinker
- **Best for:** Enterprise codebases, maximum accuracy requirements
- **Strengths:** Massive context window, excellent instruction-following
- **Weaknesses:** Slower than GPT models

### Google `gemini-3.1-pro` — The Default
- **Best for:** Quick analysis, cost-sensitive scenarios
- **Strengths:** Generous free tier, good for experimentation
- **Weaknesses:** May be less precise on complex architectural patterns

## Cost Optimization Tips

1. **Start small:** Run with `-i 1` first to check basic output, then increase
2. **Use the right model tier:** Don't use `gpt-5.2` on a 5-file project
3. **Iterate on prompts, not iterations:** If output is wrong, the issue may be in the prompts rather than needing more iterations
4. **Cache results:** Generated `AGENTS.md` files don't expire — only regenerate when the codebase significantly changes
