# Sylva 🌲

Sylva is an automated AI tool to auto-generate comprehensive `AGENTS.md` and `CODEBASE_CONVENTIONS.md` documentation by reading your entire repository recursively using **Ax-LLM**.

It extracts the folder structures, code conventions, state management patterns, and specific architecture styles embedded in your code directly into a format that future AI Coding Assistants (or human engineers) can perfectly follow.

📖 **[Full Documentation](https://achatt89.github.io/sylva/)**

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
npm start -- --github-repository https://github.com/expressjs/express -m openai/gpt-4o
```

**List Supported Models:**
```bash
npx sylva --list-models
```

### Advanced Usage: Tuning for Your Project

The iteration count (`-i`) and model choice (`-m`) dramatically affect output accuracy. Here's a battle-tested guide:

| Project Type | Example | Command | Rationale |
|---|---|---|---|
| **Small library** (<20 files) | `pallets/click` | `npx sylva -m openai/gpt-4o -i 1` | Entire codebase fits in one context pass |
| **Medium app** (20-100 files) | `expressjs/express` | `npx sylva -m openai/gpt-4o -i 5` | Needs ~5 passes to traverse nested modules |
| **Large monorepo** (multi-stack) | React + FastAPI + APIs | `npx sylva -m openai/gpt-5.2 -i 25` | Deep traversal of cross-stack dependencies |
| **Enterprise codebase** (500+ files) | Microservices | `npx sylva -m anthropic/claude-sonnet-4.6 -i 35` | Maximum depth for service-oriented architectures |

**Real-world example:** Analyzing a React/Tailwind frontend + Python/FastAPI backend + Wix API monorepo:
```bash
npx sylva --local-repository . -m openai/gpt-5.2 -i 25
```

For detailed guidance, see the [Choosing the Right Model](https://achatt89.github.io/sylva/models/choosing.html) and [Iteration Depth Guide](https://achatt89.github.io/sylva/models/iterations.html) docs.

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

---

Built by [The Logic Atelier](https://thelogicatelier.com)
