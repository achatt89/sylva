# Prompt Engineering Internals

Sylva's output quality is directly controlled by the prompts fed to the AI. This page documents the prompt architecture so contributors can understand and improve extraction accuracy.

## Prompt Architecture

Sylva uses three distinct prompt signatures defined in `src/prompts.ts`:

### 1. `CODEBASE_ANALYSIS_SIGNATURE`

**Used by:** RLM Agent (Stage 2)
**Purpose:** Defines the 17 output fields the AI must extract from the source tree

Each field has a descriptive instruction that tells the AI exactly what to look for:

```typescript
.output("techStack", f.string(
  "Tech Stack & Versions: List EVERY distinct language, library, database, " +
  "and external API dependency used. WARNING: Do NOT guess frameworks " +
  "based on assumptions or the presence of a package.json."
))
```

### 2. `COMPILE_CONVENTIONS_SIGNATURE`

**Used by:** Compilation Agent (Stage 3)
**Purpose:** Takes the 17 extracted fields and compiles them into a single cohesive Markdown document

### 3. `EXTRACT_AGENTS_SECTIONS_SIGNATURE`

**Used by:** Section Extractor (Stage 4)
**Purpose:** Splits the compiled markdown into the final 17 AGENTS.md sections with proper formatting

## Agent Identity

The `CODEBASE_ANALYZER_IDENTITY` in `src/prompts.ts` defines the AI's persona:

```
"A hyper-detailed technical architect generating strict developer manifests.
You must analyze the structural backbone, data flow, and day-to-day coding
conventions of the application using recursive analysis of the source code.
NEVER hallucinate frameworks; always verify by scanning actual source imports
and dependency files."
```

This framing is critical — it instructs the AI to act as a strict, evidence-based analyzer rather than making assumptions.

## Anti-Hallucination Rules

Several explicit instructions prevent the AI from guessing:

1. **Tech Stack verification:** "Do NOT guess frameworks based on assumptions or the presence of a `package.json`. You must explicitly scan the actual code files and dependency manifests."
2. **Architecture accuracy:** "You MUST generate an ASCII diagram showing the architecture, module relationships, and sub-services."
3. **Cross-stack communication:** Explicitly requests details on how different stacks communicate (REST, GraphQL, etc.)
4. **Evidence-based assertions:** The identity description says "NEVER hallucinate frameworks; always verify by scanning actual source imports."

## Modifying Prompts

To change what Sylva extracts or how it formats output:

1. Edit `src/prompts.ts`
2. Modify the `.output()` field descriptions for `CODEBASE_ANALYSIS_SIGNATURE`
3. Rebuild: `npm run build`
4. Test with a known repository

> **Tip:** Be as specific as possible in field descriptions. Vague instructions like "describe the code style" produce generic output. Specific instructions like "identify the exact ESLint config, Prettier rules, and import ordering conventions" produce actionable output.

See [Customizing Output](../output/customizing.md) for practical examples.
