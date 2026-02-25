# Sylva 🌲

Sylva is an automated AI tool to auto-generate comprehensive `AGENTS.md` and `CODEBASE_CONVENTIONS.md` documentation by reading your entire repository recursively using **Ax-LLM**.

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

The project is published to the NPM registry and can be executed natively anywhere!

**Option 1: Run seamlessly without installing**
```bash
# Analyze the current working directory natively
npx sylva

# Provide a specific GitHub repo
npx sylva --github-repository https://github.com/expressjs/express
```

**Option 2: Install globally on your system**
```bash
npm install -g sylva

# Once installed globally, you can execute it anywhere!
sylva
sylva --help
```

Alternatively, if running from source:
```bash
npm start -- --github-repository https://github.com/expressjs/express -m openai/gpt-5.3
```

**Positional Default Search (from source):**
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

## Contributing

We strictly follow a feature-branch workflow. Please ensure your contributions maintain high code quality and test coverage.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`) - *Our Husky pre-commit hooks will automatically lint and test your code.*
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Issues, Bugs, and Feature Requests

Please report all issues and feature requests using our [GitHub Issues](https://github.com/achatt89/sylva/issues) tracker. When reporting bugs, please provide a minimally reproducible example along with the console output (if applicable).
