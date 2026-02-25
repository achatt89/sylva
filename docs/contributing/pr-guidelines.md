# Pull Request Guidelines

We follow a strict feature-branch workflow. All changes must go through a Pull Request.

## Branch Naming

Use descriptive, kebab-case branch names prefixed by type:

```
feature/add-gemini-support
fix/hallucination-in-monorepos
docs/update-iteration-guide
chore/update-dependencies
```

## Workflow

1. **Fork** the repository (external contributors) or create a branch (team members)
2. **Create your branch** from `main`:
   ```bash
   git checkout main
   git pull origin main
   git checkout -b feature/your-feature
   ```
3. **Make changes** — follow existing code patterns
4. **Commit** — Husky will auto-format, lint, and test:
   ```bash
   git add .
   git commit -m "feat: add support for Dart file extension"
   ```
5. **Push** your branch:
   ```bash
   git push origin feature/your-feature
   ```
6. **Open a Pull Request** against `main`

## Commit Message Convention

Use [Conventional Commits](https://www.conventionalcommits.org/) format:

```
<type>: <description>

[optional body]
```

Types:
- `feat` — New feature
- `fix` — Bug fix
- `docs` — Documentation only
- `chore` — Maintenance (deps, config)
- `refactor` — Code change that neither fixes a bug nor adds a feature
- `test` — Adding or updating tests

Examples:
```
feat: add Dart and Flutter file extension support
fix: prevent hallucination in multi-stack repos
docs: update iteration depth guide with real-world examples
chore: bump @ax-llm/ax to 1.2.0
```

## PR Checklist

Before requesting review, ensure:

- [ ] Code compiles: `npm run build`
- [ ] Tests pass: `npm test`
- [ ] Linting passes: `npm run lint`
- [ ] Documentation updated (if applicable)
- [ ] Commit messages follow conventions
- [ ] Branch is rebased on latest `main`

## Review Process

1. At least one approval is required
2. All CI checks must pass
3. Squash merge into `main`
4. Delete the feature branch after merge
