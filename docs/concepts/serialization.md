# Source Tree Serialization

Sylva's accuracy depends entirely on what the AI actually "sees." The source tree serialization step controls exactly which files are included, how they're ordered, and how they're formatted for the LLM.

## How Files Are Loaded

**Function:** `loadSourceTree()` in `src/utils.ts`

The function recursively walks your repository from the root directory:

1. **Skip ignored directories** — `node_modules`, `__pycache__`, `venv`, `.git`, `dist`, `build`, etc. (18 total)
2. **Filter by extension** — Only files with recognized extensions are included (38 total, covering Python, JavaScript, TypeScript, Go, Rust, Java, and more)
3. **Allow special files** — `Dockerfile` and `Makefile` are always included regardless of extension
4. **Skip hidden directories** — Any directory starting with `.` (except the root) is excluded
5. **Enforce size limits** — Files over 500,000 characters are skipped with a warning

## Supported File Extensions

```
.py  .js  .ts  .jsx  .tsx  .vue  .java  .md  .json
.yml .yaml .txt .html .css  .scss .less  .c   .cpp
.h   .hpp  .cs  .go   .rb   .php  .rs   .sh  .swift
.kt  .sql  .xml .toml .ini  .dart .scala .r   .m  .pl
```

## Dependency Manifest Hoisting

**This is critical for accuracy.** Dependency manifests are reordered to appear **first** in the serialized tree, before any source code files. This ensures the AI reads them before forming assumptions about the tech stack.

Hoisted files include:

| File | Ecosystem |
|------|----------|
| `requirements.txt` | Python (pip) |
| `pyproject.toml` | Python (modern) |
| `Pipfile` | Python (pipenv) |
| `setup.py` / `setup.cfg` | Python (legacy) |
| `package.json` | Node.js / JavaScript |
| `go.mod` | Go |
| `Cargo.toml` | Rust |
| `pom.xml` | Java (Maven) |
| `build.gradle` / `build.gradle.kts` | Java/Kotlin (Gradle) |
| `Gemfile` | Ruby |
| `composer.json` | PHP |
| `Package.swift` | Swift |
| `Makefile` | Multi-language |
| `Dockerfile` | Containerization |
| `docker-compose.yml` / `docker-compose.yaml` | Container orchestration |

## Serialization Format

The tree is serialized as indented Markdown with code fences:

```markdown
- File: requirements.txt           ← Hoisted to top
  Content:
  ```
  fastapi==0.110.1
  uvicorn==0.25.0
  ```

- File: package.json               ← Also hoisted
  Content:
  ```json
  { "dependencies": { "react": "^19.0.0" } }
  ```

- Directory: backend/
  - File: server.py
    Content:
    ```python
    from fastapi import FastAPI
    app = FastAPI()
    ```

- Directory: frontend/
  - Directory: src/
    - File: App.jsx
      Content:
      ```jsx
      import React from 'react';
      ```
```

## Why Hoisting Matters

Without hoisting, the AI might read 50+ JavaScript files before encountering a `requirements.txt` deep in a `backend/` subdirectory. By that point, it has already formed (incorrect) assumptions about the tech stack. Hoisting ensures the AI's first impression is grounded in truth.

**Before hoisting:** AI sees `package.json` → assumes Node.js/Express backend → hallucinates Express.js
**After hoisting:** AI sees `requirements.txt` first → identifies FastAPI → correctly describes the Python backend
