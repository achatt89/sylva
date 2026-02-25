# Exit Codes

Sylva uses standard Unix exit codes to indicate success or failure.

| Code | Meaning | Description |
|------|---------|-------------|
| `0` | **Success** | Pipeline completed and `AGENTS.md` was saved |
| `1` | **Error** | An error occurred (invalid model, missing API key, network failure, etc.) |
| `130` | **Interrupted** | User pressed `Ctrl+C` to abort (SIGINT) |

## Common Error Scenarios

### Exit 1: Missing API Key

```
❌ Error occurred: Environment variable(s) OPENAI_API_KEY not set for provider openai. Exiting.
```

**Fix:** Set the required API key in your `.env` file or shell environment.

### Exit 1: Unknown Model

```
❌ Error occurred: Unknown model 'openai/gpt-99'. Supported models: ...
```

**Fix:** Use `--list-models` to see valid model names.

### Exit 1: HTTP 404 - Not Found

```
❌ Error occurred: Generate failed: HTTP 404 - Not Found
```

**Fix:** The model name exists in Sylva's catalog but is not available on the provider's API. Use a different model (e.g., `openai/gpt-4o` instead of `openai/gpt-5.3-codex`).

### Exit 1: Repository Not Found

```
❌ Error occurred: Local repository path does not exist: /bad/path
```

**Fix:** Verify the path exists and is accessible.

### Exit 130: User Abort

The user pressed `Ctrl+C` during execution. No output was saved. This is normal behavior — just re-run when ready.
