# GitHub Repository Analysis

Sylva can analyze remote GitHub repositories directly without manual cloning.

## Basic Usage

```bash
npx @thelogicatelier/sylva --github-repository https://github.com/pallets/flask -m openai/gpt-4o -i 5
```

## What Happens Under the Hood

1. **Shallow clone:** Sylva runs `git clone --depth 1` into a temporary directory
2. **Analysis:** The standard 3-stage pipeline runs against the cloned repo
3. **Output:** `AGENTS.md` is saved to `projects/<repo-name>/AGENTS.md` in your current directory
4. **Cleanup:** The temporary clone is deleted automatically

## Supported URL Formats

```bash
# HTTPS (recommended)
--github-repository https://github.com/user/repo

# HTTPS with .git suffix
--github-repository https://github.com/user/repo.git

# SSH (requires SSH key configured)
--github-repository git@github.com:user/repo.git
```

## Private Repositories

Sylva uses `git clone` under the hood, so it respects your Git credentials:

- **HTTPS:** Ensure `git credential helper` is configured
- **SSH:** Ensure your SSH key is added to the agent (`ssh-add`)

```bash
# Private repo via SSH
npx @thelogicatelier/sylva --github-repository git@github.com:my-org/private-repo.git -m openai/gpt-4o
```

## Environment Variable Shortcut

Set `GITHUB_REPO_URL` to avoid typing the URL every time:

```bash
GITHUB_REPO_URL=https://github.com/my-org/my-repo
```

Then simply:
```bash
npx @thelogicatelier/sylva -m openai/gpt-4o -i 5
```

## Limitations

- **Shallow clone only:** Sylva uses `--depth 1` for speed. Git history is not analyzed.
- **No submodule support:** Git submodules are not initialized during the clone.
- **Rate limits:** GitHub may rate-limit unauthenticated clones. Use SSH or configure Git credentials for private repos.
