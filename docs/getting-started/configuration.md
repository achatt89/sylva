# Configuration

Sylva uses environment variables for API key management and default behavior overrides. You can configure these via a `.env` file or your shell environment.

## API Keys

You need **at least one** API key from a supported provider:

| Variable | Provider | How to Get |
|----------|----------|------------|
| `OPENAI_API_KEY` | OpenAI | [platform.openai.com/api-keys](https://platform.openai.com/api-keys) |
| `ANTHROPIC_API_KEY` | Anthropic | [console.anthropic.com](https://console.anthropic.com/) |
| `GEMINI_API_KEY` or `GOOGLE_API_KEY` | Google Gemini | [aistudio.google.com/apikey](https://aistudio.google.com/apikey) |

## Setting Up Your `.env` File

```bash
# Copy the example file
cp .env-example .env
```

Edit `.env` and supply your keys:

```bash
# Required: At least one provider key
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxx
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxx
GEMINI_API_KEY=AIzaSyxxxxxxxxxx

# Optional: Web-grounded framework documentation (Framework Awareness)
# BRAVE_API_KEY=BSAxxxxxxxxxxxx

# Optional: Override default model selection
AUTOSKILL_MODEL=openai

# Optional: Default GitHub repository
GITHUB_REPO_URL=https://github.com/expressjs/express
```

## Environment Variable Precedence

Sylva resolves configuration in this order (highest priority first):

1. **CLI flags** (`-m openai/gpt-4o`) — always wins
2. **`.env` file** in the current working directory
3. **Shell environment variables** (`export OPENAI_API_KEY=...`)
4. **Built-in defaults** (Gemini provider, 35 iterations)

> **Important:** Sylva loads `.env` from the directory where you run the command, not where Sylva is installed. This means you can have different `.env` files per project.

## Behavior Overrides

| Variable | Default | Description |
|----------|---------|-------------|
| `AUTOSKILL_MODEL` | `gemini` | Default provider when `-m` is not specified. Valid values: `openai`, `anthropic`, `gemini` |
| `GITHUB_REPO_URL` | *(none)* | Default GitHub URL when no repository is specified via flags |

## Security Best Practices

- **Never commit `.env` files** to version control. Ensure `.env` is in your `.gitignore`.
- **Use project-level `.env` files** to isolate API keys per project.
- **Rotate keys regularly**, especially if you suspect exposure.
- When running in CI/CD, use your platform's secret management (GitHub Secrets, AWS SSM, etc.) instead of `.env` files.
