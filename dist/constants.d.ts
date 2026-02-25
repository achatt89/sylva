export interface ModelMetadata {
    provider: string;
    tier: "primary" | "mini";
}
export declare const PROVIDER_GEMINI = "gemini";
export declare const PROVIDER_ANTHROPIC = "anthropic";
export declare const PROVIDER_OPENAI = "openai";
export declare const MODEL_CATALOG: Record<string, ModelMetadata>;
export declare const DEFAULT_MODELS: Record<string, string>;
export declare const DEFAULT_MINI_MODELS: Record<string, string>;
export declare const API_KEY_ENV_VARS: Record<string, string[]>;
