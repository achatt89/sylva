"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.API_KEY_ENV_VARS = exports.DEFAULT_MINI_MODELS = exports.DEFAULT_MODELS = exports.MODEL_CATALOG = exports.PROVIDER_OPENAI = exports.PROVIDER_ANTHROPIC = exports.PROVIDER_GEMINI = void 0;
exports.PROVIDER_GEMINI = "gemini";
exports.PROVIDER_ANTHROPIC = "anthropic";
exports.PROVIDER_OPENAI = "openai";
exports.MODEL_CATALOG = {
    "gemini/gemini-3.1-pro": { provider: exports.PROVIDER_GEMINI, tier: "primary" },
    "gemini/gemini-3.1-flash": { provider: exports.PROVIDER_GEMINI, tier: "mini" },
    "anthropic/claude-opus-4.6": {
        provider: exports.PROVIDER_ANTHROPIC,
        tier: "primary",
    },
    "anthropic/claude-sonnet-4.6": {
        provider: exports.PROVIDER_ANTHROPIC,
        tier: "primary",
    },
    "anthropic/claude-sonnet-5": {
        provider: exports.PROVIDER_ANTHROPIC,
        tier: "primary",
    },
    "anthropic/claude-haiku-3-20250519": {
        provider: exports.PROVIDER_ANTHROPIC,
        tier: "mini",
    },
    "openai/gpt-5.3": { provider: exports.PROVIDER_OPENAI, tier: "primary" },
    "openai/gpt-5.3-codex": { provider: exports.PROVIDER_OPENAI, tier: "primary" },
};
exports.DEFAULT_MODELS = {
    [exports.PROVIDER_GEMINI]: "gemini/gemini-3.1-pro",
    [exports.PROVIDER_ANTHROPIC]: "anthropic/claude-sonnet-4.6",
    [exports.PROVIDER_OPENAI]: "openai/gpt-5.3",
};
exports.DEFAULT_MINI_MODELS = {
    [exports.PROVIDER_GEMINI]: "gemini/gemini-3.1-flash",
    [exports.PROVIDER_ANTHROPIC]: "anthropic/claude-sonnet-4.6",
    [exports.PROVIDER_OPENAI]: "openai/gpt-5.3",
};
exports.API_KEY_ENV_VARS = {
    [exports.PROVIDER_GEMINI]: ["GEMINI_API_KEY", "GOOGLE_API_KEY"],
    [exports.PROVIDER_ANTHROPIC]: ["ANTHROPIC_API_KEY"],
    [exports.PROVIDER_OPENAI]: ["OPENAI_API_KEY"],
};
