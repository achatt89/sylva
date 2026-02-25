"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.API_KEY_ENV_VARS = exports.DEFAULT_MINI_MODELS = exports.DEFAULT_MODELS = exports.MODEL_CATALOG = exports.PROVIDER_OPENAI = exports.PROVIDER_ANTHROPIC = exports.PROVIDER_GEMINI = void 0;
exports.resolveApiKey = resolveApiKey;
exports.resolveModelConfig = resolveModelConfig;
exports.getLanguageModelService = getLanguageModelService;
exports.listSupportedModels = listSupportedModels;
const ax_1 = require("@ax-llm/ax");
exports.PROVIDER_GEMINI = "gemini";
exports.PROVIDER_ANTHROPIC = "anthropic";
exports.PROVIDER_OPENAI = "openai";
exports.MODEL_CATALOG = {
    "gemini/gemini-2.5-pro": { provider: exports.PROVIDER_GEMINI, tier: "primary" },
    "gemini/gemini-2.5-flash": { provider: exports.PROVIDER_GEMINI, tier: "mini" },
    "anthropic/claude-opus-4.6": { provider: exports.PROVIDER_ANTHROPIC, tier: "primary" },
    "anthropic/claude-sonnet-4.6": { provider: exports.PROVIDER_ANTHROPIC, tier: "primary" },
    "anthropic/claude-sonnet-5": { provider: exports.PROVIDER_ANTHROPIC, tier: "primary" },
    "anthropic/claude-haiku-3-20250519": { provider: exports.PROVIDER_ANTHROPIC, tier: "mini" },
    "openai/gpt-5.2": { provider: exports.PROVIDER_OPENAI, tier: "primary" },
    "openai/gpt-5.2-instant": { provider: exports.PROVIDER_OPENAI, tier: "mini" },
    "openai/gpt-5.3-codex": { provider: exports.PROVIDER_OPENAI, tier: "primary" },
    "openai/o4-mini-deep-research": { provider: exports.PROVIDER_OPENAI, tier: "mini" },
};
exports.DEFAULT_MODELS = {
    [exports.PROVIDER_GEMINI]: "gemini/gemini-2.5-pro",
    [exports.PROVIDER_ANTHROPIC]: "anthropic/claude-sonnet-4.6",
    [exports.PROVIDER_OPENAI]: "openai/gpt-5.2",
};
exports.DEFAULT_MINI_MODELS = {
    [exports.PROVIDER_GEMINI]: "gemini/gemini-2.5-flash",
    [exports.PROVIDER_ANTHROPIC]: "anthropic/claude-sonnet-4.6",
    [exports.PROVIDER_OPENAI]: "openai/gpt-5.2",
};
exports.API_KEY_ENV_VARS = {
    [exports.PROVIDER_GEMINI]: ["GEMINI_API_KEY", "GOOGLE_API_KEY"],
    [exports.PROVIDER_ANTHROPIC]: ["ANTHROPIC_API_KEY"],
    [exports.PROVIDER_OPENAI]: ["OPENAI_API_KEY"],
};
function resolveApiKey(provider) {
    for (const envVar of exports.API_KEY_ENV_VARS[provider]) {
        if (process.env[envVar])
            return process.env[envVar];
    }
    throw new Error(`Environment variable(s) ${exports.API_KEY_ENV_VARS[provider].join(" or ")} not set for provider ${provider}. Exiting.`);
}
function resolveModelConfig(modelArg) {
    let arg = modelArg || process.env.AUTOSKILL_MODEL || exports.PROVIDER_GEMINI;
    arg = arg.trim();
    let modelName = arg;
    if (exports.DEFAULT_MODELS[arg]) {
        modelName = exports.DEFAULT_MODELS[arg];
    }
    else if (!exports.MODEL_CATALOG[arg]) {
        throw new Error(`Unknown model '${arg}'. Supported models:\n  ${Object.keys(exports.MODEL_CATALOG).sort().join(', ')}`);
    }
    const provider = exports.MODEL_CATALOG[modelName].provider;
    const apiKey = resolveApiKey(provider);
    const miniName = exports.DEFAULT_MINI_MODELS[provider];
    return {
        provider,
        model: modelName,
        model_mini: miniName,
        api_key: apiKey
    };
}
function getLanguageModelService(config, isMini = true) {
    const targetModel = isMini ? config.model_mini : config.model;
    const rawModelName = targetModel.split('/')[1]; // Strip provider prefix
    if (config.provider === exports.PROVIDER_GEMINI) {
        return new ax_1.AxAIGoogleGemini({ apiKey: config.api_key, config: { model: rawModelName } });
    }
    else if (config.provider === exports.PROVIDER_ANTHROPIC) {
        return new ax_1.AxAIAnthropic({ apiKey: config.api_key, config: { model: rawModelName } });
    }
    else {
        return new ax_1.AxAIOpenAI({ apiKey: config.api_key, config: { model: rawModelName } });
    }
}
function listSupportedModels() {
    let output = "\nSupported models:\n";
    let currentProvider = "";
    for (const [name, meta] of Object.entries(exports.MODEL_CATALOG)) {
        if (meta.provider !== currentProvider) {
            currentProvider = meta.provider;
            output += `  ${currentProvider.toUpperCase()}\n`;
        }
        let defaultTag = "";
        if (name === exports.DEFAULT_MODELS[meta.provider]) {
            defaultTag = "  (default)";
        }
        else if (name === exports.DEFAULT_MINI_MODELS[meta.provider]) {
            defaultTag = "  (default mini)";
        }
        output += `    ${name}${defaultTag}\n`;
    }
    return output;
}
