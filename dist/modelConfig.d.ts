export declare const PROVIDER_GEMINI = "gemini";
export declare const PROVIDER_ANTHROPIC = "anthropic";
export declare const PROVIDER_OPENAI = "openai";
export interface ModelMetadata {
    provider: string;
    tier: "primary" | "mini";
}
export declare const MODEL_CATALOG: Record<string, ModelMetadata>;
export declare const DEFAULT_MODELS: Record<string, string>;
export declare const DEFAULT_MINI_MODELS: Record<string, string>;
export declare const API_KEY_ENV_VARS: Record<string, string[]>;
export interface ModelConfig {
    provider: string;
    model: string;
    model_mini: string;
    api_key: string;
}
export declare function resolveApiKey(provider: string): string;
export declare function resolveModelConfig(modelArg?: string): ModelConfig;
export declare function getLanguageModelService(config: ModelConfig, isMini?: boolean): any;
export declare function listSupportedModels(): string;
