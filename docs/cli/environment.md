# Environment Variables

Sylva uses environment variables for API keys and behavior overrides. These can be set in a `.env` file or your shell environment.

## API Key Variables

| Variable | Provider | Required |
|----------|----------|----------|
| `OPENAI_API_KEY` | OpenAI | If using `-m openai/*` |
| `ANTHROPIC_API_KEY` | Anthropic | If using `-m anthropic/*` |
| `GEMINI_API_KEY` | Google Gemini | If using `-m gemini/*` |
| `GOOGLE_API_KEY` | Google Gemini (alias) | Alternative to `GEMINI_API_KEY` |
| `BRAVE_API_KEY` | Brave Search | Optional — enables web-grounded documentation |

For Gemini, Sylva checks `GEMINI_API_KEY` first, then falls back to `GOOGLE_API_KEY`.

### BRAVE_API_KEY (Framework Awareness)

The `BRAVE_API_KEY` enables **web-grounded documentation references** during Framework Awareness scanning. When set, Sylva fetches official docs for detected frameworks using version-specific queries.

**If not set:** Framework detection, version resolution, and architecture modeling all work perfectly — only web doc references are skipped. You'll see a clear warning:

```
⚠️  BRAVE_API_KEY not set — web grounding is disabled.
     → Framework detection and version resolution still work perfectly.
     → To enable web-grounded documentation references, set BRAVE_API_KEY in your .env file.
     → Get a free API key at: https://brave.com/search/api/
```

**If set but invalid:** You'll see a specific HTTP error with remediation steps (e.g., "Your BRAVE_API_KEY may be invalid or expired. Get a valid key at: https://brave.com/search/api/").

Get a free API key at **[brave.com/search/api](https://brave.com/search/api/)**.

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

# Framework Awareness — Web Grounding (Optional)
BRAVE_API_KEY=BSAxxxxxxxxxxxxxxxxxxxx

# Default to OpenAI when -m is not specified
AUTOSKILL_MODEL=openai

# Auto-analyze this repo when no args given
GITHUB_REPO_URL=https://github.com/expressjs/express
```
