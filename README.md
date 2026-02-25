# Sylva 🌲

Sylva is an automated AI tool to auto-generate comprehensive `AGENTS.md` and `CODEBASE_CONVENTIONS.md` documentation by reading your entire repository recursively using **Ax-LLM**. This project is a TypeScript port of the Python `GenerateAgents.md` tool.

It extracts the folder structures, code conventions, state management patterns, and specific architecture styles embedded in your code directly into a format that future AI Coding Assistants (or human engineers) can perfectly follow.

### Features
- Support for OpenAI, Google Gemini, Anthropic, and Azure LLMs.
- Direct `--github-repository` fetching using Git Clone.
- Direct `--local-repository` analysis.
- Multi-LLM model configuration with automatic mini-model fallback for Codebase Analysis Iterations.
- Strict Type-Safety achieved with Ax-LLM's internal framework tools.

### Setup
Install dependencies:
```bash
npm install
```

Configure your environment variables:
```bash
cp .env-example .env
# Edit .env and supply your API Keys (GEMINI_API_KEY, ANTHROPIC_API_KEY, OPENAI_API_KEY, etc)
```

Build the project:
```bash
npm run build
```

### Execution

To run Sylva, pass a Github repository or local filepath to analyze:
```bash
npm start -- https://github.com/expressjs/express
```

Alternatively, you can manually trigger options using explicit flags:
```bash
npm start -- --github-repository https://github.com/expressjs/express -m openai/gpt-4o
```

**Positional Default Search:**
```bash
npm start -- ./my-local-codebase
```

**List Supported Models:**
```bash
npm start -- --list-models
```

### Environment Overrides
- `AUTOSKILL_MODEL`: Set this to `gemini` or `anthropic` or `openai` to change the default execution provider globally without providing `-m` on every execution.
- `GITHUB_REPO_URL`: Hardcode a repository for the CLI parser to utilize if no explicit configuration flags are provided.

### Test Structure
Unit tests are located at `tests/` which mirror the `/src` folder structure separating logical test groupings.
Execute tests by running:
```bash
npm test
```
