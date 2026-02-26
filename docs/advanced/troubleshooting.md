# Troubleshooting

Common issues and their solutions.

## API Errors

### HTTP 404 - Not Found

```
❌ Error occurred: Generate failed: HTTP 404 - Not Found
```

**Cause:** The model name exists in Sylva's catalog but isn't available on the provider's API. This typically happens with newer models that haven't been publicly released.

**Fix:** Use an established model:
```bash
# Instead of unreleased models, use:
npx @thelogicatelier/sylva --local-repository . -m openai/gpt-4o -i 5
```

### HTTP 429 - Rate Limited

```
❌ Error occurred: Generate failed: HTTP 429 - Too Many Requests
```

**Cause:** You've exceeded the provider's rate limit.

**Fix:**
- Wait a few minutes and retry
- Reduce iterations (`-i`) to make fewer API calls
- Check your provider's usage dashboard for quota information

### HTTP 401 - Unauthorized

```
❌ Error occurred: Environment variable(s) OPENAI_API_KEY not set for provider openai. Exiting.
```

**Fix:** Set your API key in `.env` or your shell environment. See [Configuration](../getting-started/configuration.md).

## Output Quality Issues

### Generic/Shallow Output

**Symptom:** AGENTS.md says generic things like "Use standard patterns" without specifics.

**Fixes:**
1. Increase iterations: `-i 15` or `-i 25`
2. Use a stronger primary model: `openai/gpt-5.2` or `anthropic/claude-sonnet-4.6`
3. Check that your files have supported extensions (see [Serialization](../concepts/serialization.md))

### Wrong Tech Stack (Hallucination)

**Symptom:** AGENTS.md says "Express.js" when your backend is actually FastAPI.

**Fixes:**
1. Ensure dependency manifests exist at expected locations (`requirements.txt`, `package.json`)
2. Increase iterations so the AI has time to read all manifests
3. Use a primary-tier model (not a mini model)

### "Not Evidenced" for Existing Features

**Symptom:** AGENTS.md says "No database is currently evidenced" even though you have MongoDB.

**Fix:** Increase iterations. The AI didn't have enough passes to traverse into the subdirectory containing database configuration.

### AI Analyzing Its Own Runtime Code

**Symptom:** AGENTS.md talks about "debugging JavaScript code to extract the first 1000 characters from a variable named `sourceContext`."

**Cause:** The RLM agent at very high iterations began analyzing the JavaScript runtime snippets it generates for internal searching, rather than the actual project source.

**Fix:** Reduce iterations to a reasonable value (15-25 for large repos, 1-5 for small repos).

## CLI Issues

### `sylva: command not found`

**Fix:** Use `npx @thelogicatelier/sylva` instead, or ensure the global npm bin directory is in your `PATH`:
```bash
export PATH="$(npm config get prefix)/bin:$PATH"
```

### CLI Hangs After Completion

**Symptom:** `AGENTS.md Generation Complete!` is shown but the process doesn't exit.

**Cause:** This was a bug in versions prior to 1.0.2. Ax-LLM HTTP connections kept the Node.js event loop alive.

**Fix:** Update to the latest version:
```bash
npm install -g @thelogicatelier/sylva@latest
```

### Large Files Skipped

```
File /path/to/package-lock.json skipped due to being too large (818730 chars)
```

This is expected behavior. Files over 500,000 characters are skipped to prevent context overflow. Lock files, minified bundles, and similar files are intentionally excluded.

## Performance Issues

### Slow Execution

**Causes:**
- High iteration count (each iteration is an LLM round-trip)
- Large repository with many files
- Provider API latency

**Fixes:**
- Reduce iterations for faster results
- Use `gpt-4o` (faster than `gpt-5.2` or Claude)
- Ensure unnecessary files are excluded (check `IGNORED_DIRS` and `ALLOWED_EXTENSIONS`)

### High API Costs

**Fixes:**
- Use `-i 1` for quick, cheap analysis
- Use `gpt-4o` instead of premium models
- Cache results: only regenerate when the codebase significantly changes
