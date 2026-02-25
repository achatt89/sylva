# Extending Sylva

This guide covers how to add new providers, models, file extensions, and output sections to Sylva.

## Adding a New Model

1. Open `src/constants.ts`
2. Add the model to `MODEL_CATALOG`:

```typescript
export const MODEL_CATALOG: Record<string, ModelMetadata> = {
  // ... existing models

  // Your new model
  "provider/model-name": { provider: PROVIDER_OPENAI, tier: "primary" },
};
```

3. If it's a new provider, add it to the defaults:

```typescript
export const DEFAULT_MODELS: Record<string, string> = {
  // ... existing defaults
  [PROVIDER_NEW]: "provider/model-name",
};
```

4. Rebuild: `npm run build`

## Adding a New Provider

1. Add the provider constant to `src/constants.ts`:

```typescript
export const PROVIDER_NEWPROVIDER = "newprovider";
```

2. Add the API key variable to `API_KEY_ENV_VARS`:

```typescript
export const API_KEY_ENV_VARS: Record<string, string[]> = {
  // ... existing
  [PROVIDER_NEWPROVIDER]: ["NEWPROVIDER_API_KEY"],
};
```

3. Add default models for the provider to `DEFAULT_MODELS` and `DEFAULT_MINI_MODELS`
4. Add models to `MODEL_CATALOG`
5. Update the model resolution logic in `src/modelConfig.ts` if the provider has special requirements
6. Rebuild: `npm run build`

## Adding File Extensions

To support a new file type in source tree scanning:

1. Open `src/constants.ts`
2. Add the extension to `ALLOWED_EXTENSIONS`:

```typescript
export const ALLOWED_EXTENSIONS = new Set([
  // ... existing
  ".lua",   // Lua scripts
  ".zig",   // Zig language
]);
```

3. Rebuild: `npm run build`

## Adding Ignored Directories

To ignore additional directories during scanning:

1. Open `src/constants.ts`
2. Add the directory name to `IGNORED_DIRS`:

```typescript
export const IGNORED_DIRS = new Set([
  // ... existing
  ".cache",
  ".terraform",
]);
```

## Adding Dependency Manifests

To hoist additional dependency files to the top of the serialized tree:

1. Open `src/constants.ts`
2. Add the filename to `DEPENDENCY_MANIFESTS`:

```typescript
export const DEPENDENCY_MANIFESTS = new Set([
  // ... existing
  "mix.exs",         // Elixir
  "pubspec.yaml",    // Dart/Flutter
]);
```

## Adding Output Sections

See [Customizing Output](../output/customizing.md) for detailed instructions on adding, modifying, or removing AGENTS.md sections.
