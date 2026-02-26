# Supported Models

Sylva supports models from three major AI providers. Each model is identified using the `provider/model-name` format.

## Model Catalog

### Google Gemini

| Model | Tier | Use Case |
|-------|------|----------|
| `gemini/gemini-3.1-pro` | Primary (default) | High-quality analysis with large context windows |
| `gemini/gemini-3.1-flash` | Mini | Fast section extraction, lower cost |
| `gemini/gemini-3-deep-think` | Primary | Extended reasoning for complex architectures |

### Anthropic Claude

| Model | Tier | Use Case |
|-------|------|----------|
| `anthropic/claude-opus-4.6` | Primary | Premium analysis, highest accuracy |
| `anthropic/claude-sonnet-4.6` | Primary (default) | Best balance of speed and quality |
| `anthropic/claude-sonnet-5` | Primary | Latest generation, improved reasoning |
| `anthropic/claude-haiku-4.5` | Mini | Fast, low-cost section extraction |
| `anthropic/claude-haiku-3-20250519` | Mini | Legacy mini model |

### OpenAI

| Model | Tier | Use Case |
|-------|------|----------|
| `openai/gpt-5.3` | Primary | Latest OpenAI flagship |
| `openai/gpt-5.3-codex` | Primary | Code-optimized variant |
| `openai/gpt-5.2` | Primary | Strong reasoning, reliable for monorepos |
| `openai/gpt-4o` | Primary (default) | Battle-tested, excellent accuracy-to-cost ratio |
| `openai/gpt-4o-mini` | Mini | Fast, cheap section extraction |

## How Tiers Work

When you select a model with `-m`, Sylva automatically assigns:

- **Primary model** → Used for RLM analysis and conventions compilation (accuracy-critical)
- **Mini model** → Used for section extraction (speed-critical, cost-efficient)

The mini model is always the default mini for that provider. You cannot currently override the mini model independently.

## Default Models Per Provider

| Provider | Default Primary | Default Mini |
|----------|----------------|-------------|
| `gemini` | `gemini/gemini-3.1-pro` | `gemini/gemini-3.1-flash` |
| `anthropic` | `anthropic/claude-sonnet-4.6` | `anthropic/claude-haiku-3-20250519` |
| `openai` | `openai/gpt-4o` | `openai/gpt-4o-mini` |

## Listing Models

```bash
# See all available models
npx @thelogicatelier/sylva --list-models
```

## API Key Requirements

Each provider requires its own API key. See [Configuration](../getting-started/configuration.md) for setup instructions.
