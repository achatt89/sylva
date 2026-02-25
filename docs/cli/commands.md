# Commands & Flags

## Usage

```bash
sylva [repo] [options]
```

The `[repo]` positional argument accepts an absolute path to a local repository. If omitted, Sylva prompts interactively or falls back to environment variables.

## Options

| Flag | Alias | Type | Default | Description |
|------|-------|------|---------|-------------|
| `--github-repository <url>` | | String | | Public GitHub repository URL to analyze |
| `--local-repository <path>` | | String | | Absolute path to a local repository |
| `-m, --model <model>` | | String | Provider default | LLM model in `provider/model` format |
| `-i, --max-iterations <n>` | | Number | `35` | Maximum RLM iterations for codebase analysis |
| `--list-models` | | Boolean | `false` | List all supported models and exit |
| `--version` | `-V` | Boolean | | Print version number |
| `--help` | `-h` | Boolean | | Display help text |

## Examples

### Analyze a Local Repository

```bash
# Explicit flag
sylva --local-repository /Users/me/projects/my-app -m openai/gpt-4o -i 5

# Positional argument
sylva /Users/me/projects/my-app

# Current directory (interactive prompt)
cd /Users/me/projects/my-app
sylva
```

### Analyze a GitHub Repository

```bash
sylva --github-repository https://github.com/pallets/flask -m openai/gpt-4o -i 5
```

Sylva will:
1. Shallow-clone the repo into a temporary directory
2. Run the analysis pipeline
3. Save `AGENTS.md` to `projects/<repo-name>/AGENTS.md`
4. Delete the temporary clone

### Complex Monorepo Analysis

```bash
sylva --local-repository . -m openai/gpt-5.2 -i 25
```

### List Available Models

```bash
sylva --list-models
```

Output:
```
Supported models:
  GEMINI
    gemini/gemini-3.1-pro  (default)
    gemini/gemini-3.1-flash  (default mini)
    gemini/gemini-3-deep-think
  ANTHROPIC
    anthropic/claude-opus-4.6
    anthropic/claude-sonnet-4.6  (default)
    ...
  OPENAI
    openai/gpt-4o  (default)
    openai/gpt-4o-mini  (default mini)
    ...
```

## Output Location

Generated files are saved to:
```
<cwd>/projects/<repo-name>/AGENTS.md
```

For example, if you analyze a project called `my-app`:
```
./projects/my-app/AGENTS.md
```
