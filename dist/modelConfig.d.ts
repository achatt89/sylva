export interface ModelMetadata {
    provider: string;
    tier: "primary" | "mini";
}
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
