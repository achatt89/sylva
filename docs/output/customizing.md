# Customizing Output

You can customize what Sylva extracts and how it formats the `AGENTS.md` by modifying the prompt signatures in `src/prompts.ts`.

## Modifying Extraction Fields

Each output field in `CODEBASE_ANALYSIS_SIGNATURE` has a description string that instructs the AI on what to extract. To change the output:

1. Open `src/prompts.ts`
2. Find the `.output()` call for the field you want to change
3. Modify the description string
4. Rebuild: `npm run build`

### Example: Adding Framework Version Detection

Change:
```typescript
.output("techStack", f.string("Tech Stack & Versions: List EVERY distinct language..."))
```

To:
```typescript
.output("techStack", f.string(
  "Tech Stack & Versions: List EVERY distinct language with EXACT version " +
  "numbers from lock files (e.g., 'React 19.0.0' not just 'React'). " +
  "Include build tools, linters, and CI runners."
))
```

## Adding New Sections

To add a new section to AGENTS.md:

1. Add a new `.output()` field to `CODEBASE_ANALYSIS_SIGNATURE` in `src/prompts.ts`
2. Add the corresponding field to `EXTRACT_AGENTS_SECTIONS_SIGNATURE`
3. Add the field to the `AgentsMdSections` interface in `src/utils.ts`
4. Add the heading mapping to `AGENTS_SECTION_HEADINGS` in `src/utils.ts`
5. Rebuild: `npm run build`

## Removing Sections

To remove a section you don't need:

1. Remove the `.output()` call from both signatures in `src/prompts.ts`
2. Remove the field from `AgentsMdSections` in `src/utils.ts`
3. Remove the heading mapping from `AGENTS_SECTION_HEADINGS`
4. Rebuild

## Changing the Agent Persona

Edit `CODEBASE_ANALYZER_IDENTITY` in `src/prompts.ts`:

```typescript
export const CODEBASE_ANALYZER_IDENTITY = {
  name: "CodebaseAnalyzer",
  description: "Your custom description here..."
};
```

> **Warning:** Be careful when modifying the anti-hallucination rules in the identity description. Removing them may cause the AI to guess frameworks incorrectly.
