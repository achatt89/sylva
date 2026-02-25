"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveApiKey = resolveApiKey;
exports.resolveModelConfig = resolveModelConfig;
exports.getLanguageModelService = getLanguageModelService;
exports.listSupportedModels = listSupportedModels;
const ax_1 = require("@ax-llm/ax");
const constants_1 = require("./constants");
function resolveApiKey(provider) {
    for (const envVar of constants_1.API_KEY_ENV_VARS[provider]) {
        if (process.env[envVar])
            return process.env[envVar];
    }
    throw new Error(`Environment variable(s) ${constants_1.API_KEY_ENV_VARS[provider].join(" or ")} not set for provider ${provider}. Exiting.`);
}
function resolveModelConfig(modelArg) {
    let arg = modelArg || process.env.AUTOSKILL_MODEL || constants_1.PROVIDER_GEMINI;
    arg = arg.trim();
    let modelName = arg;
    if (constants_1.DEFAULT_MODELS[arg]) {
        modelName = constants_1.DEFAULT_MODELS[arg];
    }
    else if (!constants_1.MODEL_CATALOG[arg]) {
        throw new Error(`Unknown model '${arg}'. Supported models:\n  ${Object.keys(constants_1.MODEL_CATALOG).sort().join(", ")}`);
    }
    const provider = constants_1.MODEL_CATALOG[modelName].provider;
    const apiKey = resolveApiKey(provider);
    const miniName = constants_1.DEFAULT_MINI_MODELS[provider];
    return {
        provider,
        model: modelName,
        model_mini: miniName,
        api_key: apiKey,
    };
}
function getLanguageModelService(config, isMini = true) {
    const targetModel = isMini ? config.model_mini : config.model;
    const rawModelName = targetModel.split("/")[1]; // Strip provider prefix
    if (config.provider === constants_1.PROVIDER_GEMINI) {
        return new ax_1.AxAIGoogleGemini({
            apiKey: config.api_key,
            config: { model: rawModelName },
        });
    }
    else if (config.provider === constants_1.PROVIDER_ANTHROPIC) {
        return new ax_1.AxAIAnthropic({
            apiKey: config.api_key,
            config: { model: rawModelName },
        });
    }
    else {
        return new ax_1.AxAIOpenAI({
            apiKey: config.api_key,
            config: { model: rawModelName },
        });
    }
}
function listSupportedModels() {
    let output = "\nSupported models:\n";
    let currentProvider = "";
    for (const [name, meta] of Object.entries(constants_1.MODEL_CATALOG)) {
        if (meta.provider !== currentProvider) {
            currentProvider = meta.provider;
            output += `  ${currentProvider.toUpperCase()}\n`;
        }
        let defaultTag = "";
        if (name === constants_1.DEFAULT_MODELS[meta.provider]) {
            defaultTag = "  (default)";
        }
        else if (name === constants_1.DEFAULT_MINI_MODELS[meta.provider]) {
            defaultTag = "  (default mini)";
        }
        output += `    ${name}${defaultTag}\n`;
    }
    return output;
}
