# Installation

Sylva can be installed and run in multiple ways depending on your workflow.

## Option 1: Run Instantly with npx (Recommended)

No installation required. Run against any repository:

```bash
# Analyze the current directory
npx sylva

# Analyze a specific local path
npx sylva --local-repository /path/to/your/project

# Analyze a GitHub repository
npx sylva --github-repository https://github.com/expressjs/express
```

## Option 2: Install Globally

```bash
npm install -g sylva

# Now available everywhere
sylva --help
sylva --local-repository .
sylva --list-models
```

## Option 3: Install from Source

```bash
git clone https://github.com/achatt89/sylva.git
cd sylva
npm install
npm run build
```

When running from source, use `npm start --` to pass arguments:

```bash
npm start -- --local-repository /path/to/project -m openai/gpt-4o -i 5
```

## System Requirements

| Requirement | Minimum |
|-------------|---------|
| Node.js | v18+ |
| npm | v8+ |
| Git | Required only for `--github-repository` |
| API Key | At least one: OpenAI, Anthropic, or Google Gemini |

## Verifying Installation

```bash
# Check the installed version
sylva --version

# List all supported models
sylva --list-models
```

If `sylva` is not found after global install, ensure your npm global bin directory is in your `PATH`:

```bash
# Find npm global bin directory
npm config get prefix

# Add to PATH (add to your ~/.bashrc or ~/.zshrc)
export PATH="$(npm config get prefix)/bin:$PATH"
```
