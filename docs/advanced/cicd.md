# CI/CD Integration

Sylva can be integrated into your CI/CD pipeline to automatically generate or update `AGENTS.md` on every push.

## GitHub Actions Example

```yaml
name: Generate AGENTS.md

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  generate:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: "22"

      - name: Generate AGENTS.md
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
        run: |
          npx sylva --local-repository . -m openai/gpt-4o -i 5

      - name: Commit AGENTS.md
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          cp projects/$(basename $PWD)/AGENTS.md ./AGENTS.md
          git add AGENTS.md
          git diff --cached --quiet || git commit -m "chore: update AGENTS.md"
          git push
```

## Key Considerations

### API Key Security
- Store API keys as **GitHub Secrets** (`Settings → Secrets and variables → Actions`)
- Never hardcode keys in workflow files

### Cost Control
- Use `-i 1` or `-i 3` for CI runs to minimize API costs
- Consider running on `workflow_dispatch` (manual trigger) instead of every push
- Use the mini model for CI: `-m openai/gpt-4o` keeps costs low

### When to Regenerate
Regenerate `AGENTS.md` when:
- Major dependency changes (new frameworks, libraries)
- Significant architectural changes (new services, restructured directories)
- New team members onboard (refresh the context)

Don't regenerate on:
- Minor bug fixes
- Content changes (copy, translations)
- Test-only changes

## GitLab CI Example

```yaml
generate-agents:
  image: node:22
  stage: docs
  script:
    - npx sylva --local-repository . -m openai/gpt-4o -i 5
    - cp projects/$(basename $PWD)/AGENTS.md ./AGENTS.md
  artifacts:
    paths:
      - AGENTS.md
  only:
    - main
  when: manual
```

## Jenkins Pipeline

```groovy
pipeline {
    agent { docker { image 'node:22' } }
    environment {
        OPENAI_API_KEY = credentials('openai-api-key')
    }
    stages {
        stage('Generate AGENTS.md') {
            steps {
                sh 'npx sylva --local-repository . -m openai/gpt-4o -i 5'
                sh "cp projects/\$(basename \$PWD)/AGENTS.md ./AGENTS.md"
            }
        }
    }
}
```
