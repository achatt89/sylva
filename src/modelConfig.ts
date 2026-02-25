import { AxAIOpenAI, AxAIGoogleGemini, AxAIAnthropic, AxAIService } from '@ax-llm/ax';

export const PROVIDER_GEMINI = "gemini";
export const PROVIDER_ANTHROPIC = "anthropic";
export const PROVIDER_OPENAI = "openai";

export interface ModelMetadata {
    provider: string;
    tier: "primary" | "mini";
}

export const MODEL_CATALOG: Record<string, ModelMetadata> = {
    "gemini/gemini-2.5-pro": { provider: PROVIDER_GEMINI, tier: "primary" },
    "gemini/gemini-2.5-flash": { provider: PROVIDER_GEMINI, tier: "mini" },
    "anthropic/claude-opus-4.6": { provider: PROVIDER_ANTHROPIC, tier: "primary" },
    "anthropic/claude-sonnet-4.6": { provider: PROVIDER_ANTHROPIC, tier: "primary" },
    "anthropic/claude-sonnet-5": { provider: PROVIDER_ANTHROPIC, tier: "primary" },
    "anthropic/claude-haiku-3-20250519": { provider: PROVIDER_ANTHROPIC, tier: "mini" },
    "openai/gpt-5.2": { provider: PROVIDER_OPENAI, tier: "primary" },
    "openai/gpt-5.2-instant": { provider: PROVIDER_OPENAI, tier: "mini" },
    "openai/gpt-5.3-codex": { provider: PROVIDER_OPENAI, tier: "primary" },
    "openai/o4-mini-deep-research": { provider: PROVIDER_OPENAI, tier: "mini" },
};

export const DEFAULT_MODELS: Record<string, string> = {
    [PROVIDER_GEMINI]: "gemini/gemini-2.5-pro",
    [PROVIDER_ANTHROPIC]: "anthropic/claude-sonnet-4.6",
    [PROVIDER_OPENAI]: "openai/gpt-5.2",
};

export const DEFAULT_MINI_MODELS: Record<string, string> = {
    [PROVIDER_GEMINI]: "gemini/gemini-2.5-flash",
    [PROVIDER_ANTHROPIC]: "anthropic/claude-sonnet-4.6",
    [PROVIDER_OPENAI]: "openai/gpt-5.2",
};

export const API_KEY_ENV_VARS: Record<string, string[]> = {
    [PROVIDER_GEMINI]: ["GEMINI_API_KEY", "GOOGLE_API_KEY"],
    [PROVIDER_ANTHROPIC]: ["ANTHROPIC_API_KEY"],
    [PROVIDER_OPENAI]: ["OPENAI_API_KEY"],
};

export interface ModelConfig {
    provider: string;
    model: string;
    model_mini: string;
    api_key: string;
}

export function resolveApiKey(provider: string): string {
    for (const envVar of API_KEY_ENV_VARS[provider]) {
        if (process.env[envVar]) return process.env[envVar] as string;
    }
    throw new Error(`Environment variable(s) ${API_KEY_ENV_VARS[provider].join(" or ")} not set for provider ${provider}. Exiting.`);
}

export function resolveModelConfig(modelArg?: string): ModelConfig {
    let arg = modelArg || process.env.AUTOSKILL_MODEL || PROVIDER_GEMINI;
    arg = arg.trim();

    let modelName = arg;
    if (DEFAULT_MODELS[arg]) {
        modelName = DEFAULT_MODELS[arg];
    } else if (!MODEL_CATALOG[arg]) {
        throw new Error(`Unknown model '${arg}'. Supported models:\n  ${Object.keys(MODEL_CATALOG).sort().join(', ')}`);
    }

    const provider = MODEL_CATALOG[modelName].provider;
    const apiKey = resolveApiKey(provider);
    const miniName = DEFAULT_MINI_MODELS[provider];

    return {
        provider,
        model: modelName,
        model_mini: miniName,
        api_key: apiKey
    };
}

export function getLanguageModelService(config: ModelConfig, isMini: boolean = true): any {
    const targetModel = isMini ? config.model_mini : config.model;
    const rawModelName = targetModel.split('/')[1] as any; // Strip provider prefix
    if (config.provider === PROVIDER_GEMINI) {
        return new AxAIGoogleGemini({ apiKey: config.api_key, config: { model: rawModelName } });
    } else if (config.provider === PROVIDER_ANTHROPIC) {
        return new AxAIAnthropic({ apiKey: config.api_key, config: { model: rawModelName } });
    } else {
        return new AxAIOpenAI({ apiKey: config.api_key, config: { model: rawModelName } });
    }
}

export function listSupportedModels(): string {
    let output = "\nSupported models:\n";
    let currentProvider = "";

    for (const [name, meta] of Object.entries(MODEL_CATALOG)) {
        if (meta.provider !== currentProvider) {
            currentProvider = meta.provider;
            output += `  ${currentProvider.toUpperCase()}\n`;
        }
        let defaultTag = "";
        if (name === DEFAULT_MODELS[meta.provider]) {
            defaultTag = "  (default)";
        } else if (name === DEFAULT_MINI_MODELS[meta.provider]) {
            defaultTag = "  (default mini)";
        }
        output += `    ${name}${defaultTag}\n`;
    }
    return output;
}
