# Environment Variables

Sylva uses environment variables for API keys and behavior overrides. These can be set in a `.env` file or your shell environment.

## API Key Variables

| Variable | Provider | Required |
|----------|----------|----------|
| `OPENAI_API_KEY` | OpenAI | If using `-m openai/*` |
| `ANTHROPIC_API_KEY` | Anthropic | If using `-m anthropic/*` |
| `GEMINI_API_KEY` | Google Gemini | If using `-m gemini/*` |
| `GOOGLE_API_KEY` | Google Gemini (alias) | Alternative to `GEMINI_API_KEY` |

For Gemini, Sylva checks `GEMINI_API_KEY` first, then falls back to `GOOGLE_API_KEY`.

## Behavior Overrides

| Variable | Default | Description |
|----------|---------|-------------|
| `AUTOSKILL_MODEL` | `gemini` | Default provider when `-m` is not specified. Accepts provider names (`openai`, `anthropic`, `gemini`) or full model names (`openai/gpt-4o`) |
| `GITHUB_REPO_URL` | *(none)* | Default GitHub URL used when no `--github-repository` or `--local-repository` flag is provided |

## Precedence Order

1. **CLI flags** (`-m openai/gpt-4o`) — highest priority
2. **`.env` file** in current working directory
3. **Shell environment** (`export OPENAI_API_KEY=...`)
4. **Built-in defaults**

## Example `.env` File

```bash
# API Keys
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxx
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxx
GEMINI_API_KEY=AIzaSyxxxxxxxxxxxxxxxxxxxx

# Default to OpenAI when -m is not specified
AUTOSKILL_MODEL=openai

# Auto-analyze this repo when no args given
GITHUB_REPO_URL=https://github.com/expressjs/express
```
