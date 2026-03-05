# Framework Awareness

Framework Awareness is Sylva's deterministic pre-LLM scanning system. It inspects your entire repository for manifest files, detects frameworks and versions, and builds authoritative constraints that prevent the LLM from hallucinating your tech stack.

## Why It Matters

Without Framework Awareness, Sylva relied entirely on the LLM to identify frameworks from source code. This led to hallucinations — for example, generating JavaScript string-slicing documentation for an OpenClaw config repository that only contains `openclaw.json`.

Framework Awareness solves this by providing **deterministic evidence** before the LLM runs.

## How It Works

```text
┌──────────────────────┐
│ 1. Manifest Scanning │   Walks the ENTIRE repo, finds ~30 manifest
│    manifestScanner   │   file patterns (package.json, pom.xml, etc.)
└──────────┬───────────┘   at ANY depth (handles monorepos)
           │
           v
┌──────────────────────┐
│ 2. Signal Extraction │   Specialized parsers emit typed Signals:
│    manifestParsers   │   framework, version, tooling, orchestrator
└──────────┬───────────┘   with evidence (file + reason)
           │
           v
┌──────────────────────┐
│ 3. Version Resolution│   Consolidates versions per framework:
│    versionResolver   │   exact > ambiguous > unknown
└──────────┬───────────┘   NEVER assumes a version
           │
           v
┌──────────────────────┐
│ 4. Stack Detection   │   Groups signals into stacks with confidence
│    detector          │   scores, scoped to subproject paths
└──────────┬───────────┘   Detects monorepo structure + orchestrators
           │
           v
┌──────────────────────┐
│ 5. Web Grounding     │   (Optional: requires BRAVE_API_KEY)
│    webGrounding      │   Fetches version-specific official docs
└──────────┬───────────┘   Falls back to latest docs if version unknown
           │
           v
┌──────────────────────┐
│ 6. Constraints Block │   Builds ARCHITECTURE CONSTRAINTS text
│    & awareness.json  │   Injected into ALL 3 LLM prompt signatures
└──────────────────────┘
```

## Supported Frameworks

| Ecosystem | Manifest Files | Detected Frameworks |
|-----------|---------------|-------------------|
| **OpenClaw** | `openclaw.json` | OpenClaw (orchestrator), tools, channels |
| **Node.js/JS/TS** | `package.json` | React, Angular, Vue, Next.js, Nuxt, Svelte, Express, NestJS, Fastify, TypeScript |
| **Python** | `requirements.txt`, `pyproject.toml`, `Pipfile`, `setup.cfg` | Django, Flask, FastAPI, SQLAlchemy, Celery |
| **Java/JVM** | `pom.xml`, `build.gradle(.kts)` | Spring Boot, Quarkus, Micronaut, Hibernate |
| **.NET** | `*.csproj`, `global.json` | ASP.NET Core, .NET SDK |
| **Go** | `go.mod` | Gin, Echo, Fiber, GORM |
| **Rust** | `Cargo.toml` | Actix, Axum, Rocket, Tokio, Diesel |
| **Other** | `angular.json`, `Dockerfile` | Angular workspaces, Docker |

## Version Certainty

Sylva uses three certainty levels:

| Certainty | Meaning | Example |
|-----------|---------|---------|
| **exact** | Pinned version found in manifest or lockfile | `"@angular/core": "17.2.0"` |
| **ambiguous** | Version range without lockfile resolution | `"react": "^18.0"` |
| **unknown** | No version information found | Framework detected but no version specified |

> **Key rule:** Sylva NEVER assumes a version. If the version cannot be determined from explicit manifest data, it is marked as `unknown`.

## ARCHITECTURE CONSTRAINTS Block

The constraints block is injected into all three LLM prompt signatures. It looks like:

```
=== ARCHITECTURE CONSTRAINTS (AUTHORITATIVE) ===
1) The detected frameworks/stacks listed below are authoritative...
2) You MUST NOT invent additional frameworks...
3) If evidence is missing or ambiguous, say "unknown"...
4) Versions: Only state a version if explicitly detected...

DETECTED STACKS:
  - Angular: 17.2.0 (exact; package.json)
    Evidence: Found @angular/core dependency [frontend/package.json]
  - FastAPI: 0.109.0 (exact; pyproject.toml)
    Evidence: Found fastapi dependency [services/api/pyproject.toml]
  - Spring Boot: 3.2.1 (exact; pom.xml)
    Evidence: Found spring-boot-starter-parent [services/core/pom.xml]
=== END ARCHITECTURE CONSTRAINTS ===
```

## Web Grounding (Optional)

When `BRAVE_API_KEY` is set, Sylva fetches official documentation for detected frameworks:

- **Versioned queries:** When an exact version is known (e.g., `Angular 17`), queries target version-specific docs
- **Latest fallback:** When version is unknown/ambiguous, queries target the latest official docs and label them as fallback
- **Caching:** Results are cached to disk (`projects/<repo>/cache/brave/`) to avoid redundant API calls

**If `BRAVE_API_KEY` is not set:** All deterministic detection, version resolution, and architecture modeling still work perfectly. Only web doc references are skipped. You'll see a clear warning:

```
⚠️  BRAVE_API_KEY not set — web grounding is disabled.
     → Framework detection and version resolution still work perfectly.
     → To enable web-grounded documentation references, set BRAVE_API_KEY in your .env file.
     → Get a free API key at: https://brave.com/search/api/
```

## Debug Output

After every run, Sylva saves `awareness.json` alongside `AGENTS.md` with the full detection results:

```json
{
  "manifests": [...],
  "stacks": [
    {
      "frameworkId": "angular",
      "frameworkName": "Angular",
      "confidence": 85,
      "versions": [{ "value": "17.2.0", "certainty": "exact" }],
      "rootPath": "frontend"
    }
  ],
  "architecture": {
    "repoType": "monorepo",
    "primaryOrchestrator": { "id": "openclaw" },
    "workloads": [...]
  }
}
```

Use this to verify that the detection is correct before reviewing the generated `AGENTS.md`.
