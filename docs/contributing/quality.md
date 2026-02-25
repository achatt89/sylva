# Code Quality & Hooks

Sylva enforces code quality through ESLint, Prettier, and Husky pre-commit hooks.

## ESLint

ESLint is configured in `eslint.config.mjs` using the flat config format with TypeScript-ESLint.

```bash
# Run linting
npm run lint
```

Linting checks both `src/` and `tests/src/`.

## Prettier

Prettier handles code formatting for all TypeScript files.

```bash
# Format all files
npm run format
```

## Husky Pre-Commit Hooks

When you commit, Husky automatically runs:

1. `npm run format` — Formats all TypeScript files
2. `npm run lint` — Checks for code quality issues
3. `npm test` — Runs the full test suite

If any step fails, the commit is rejected. This ensures that every commit in the repository passes formatting, linting, and testing.

## Configuration Files

| File | Purpose |
|------|---------|
| `eslint.config.mjs` | ESLint flat config with TypeScript-ESLint rules |
| `.prettierrc` or `package.json` | Prettier configuration |
| `.husky/pre-commit` | Husky hook script |
| `tsconfig.json` | TypeScript compiler configuration |

## Bypassing Hooks (Emergency Only)

```bash
# Skip pre-commit hooks (use sparingly!)
git commit --no-verify -m "emergency fix"
```

> **Warning:** Only bypass hooks in genuine emergencies. All CI pipelines assume these checks pass.
