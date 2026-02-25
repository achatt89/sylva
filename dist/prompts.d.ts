export declare const CODEBASE_ANALYSIS_SIGNATURE: import("@ax-llm/ax").AxSignature<{
    readonly sourceContext: string;
}, {
    readonly projectOverview: string;
} & {
    readonly agentPersona: string;
} & {
    readonly techStack: string;
} & {
    readonly directoryStructure: string;
} & {
    readonly executionCommands: string;
} & {
    readonly codeStyleAndFormatting: string;
} & {
    readonly architectureAndDesignPatterns: string;
} & {
    readonly antiPatternsAndRestrictions: string;
} & {
    readonly dependencyManagement: string;
} & {
    readonly stateManagementGuidelines: string;
} & {
    readonly databaseAndDataHandling: string;
} & {
    readonly errorHandlingAndLogging: string;
} & {
    readonly testingStrategy: string;
} & {
    readonly securityAndCompliance: string;
} & {
    readonly gitAndVersionControl: string;
} & {
    readonly documentationStandards: string;
} & {
    readonly agentWorkflow: string;
} & {
    readonly fewShotExamples: string;
}>;
export declare const CODEBASE_ANALYZER_IDENTITY: {
    name: string;
    description: string;
};
export declare const COMPILE_CONVENTIONS_SIGNATURE: import("@ax-llm/ax").AxSignature<{
    readonly projectOverview: string;
} & {
    readonly agentPersona: string;
} & {
    readonly techStack: string;
} & {
    readonly directoryStructure: string;
} & {
    readonly executionCommands: string;
} & {
    readonly codeStyleAndFormatting: string;
} & {
    readonly architectureAndDesignPatterns: string;
} & {
    readonly antiPatternsAndRestrictions: string;
} & {
    readonly dependencyManagement: string;
} & {
    readonly stateManagementGuidelines: string;
} & {
    readonly databaseAndDataHandling: string;
} & {
    readonly errorHandlingAndLogging: string;
} & {
    readonly testingStrategy: string;
} & {
    readonly securityAndCompliance: string;
} & {
    readonly gitAndVersionControl: string;
} & {
    readonly documentationStandards: string;
} & {
    readonly agentWorkflow: string;
} & {
    readonly fewShotExamples: string;
}, {
    readonly markdownDocument: string;
}>;
export declare const EXTRACT_AGENTS_SECTIONS_SIGNATURE: import("@ax-llm/ax").AxSignature<{
    readonly conventionsMarkdown: string;
} & {
    readonly repositoryName: string;
}, {
    readonly projectOverview: string;
} & {
    readonly techStack: string;
} & {
    readonly architecture: string;
} & {
    readonly codeStyle: string;
} & {
    readonly antiPatternsAndRestrictions: string;
} & {
    readonly databaseAndState: string;
} & {
    readonly errorHandlingAndLogging: string;
} & {
    readonly testingCommands: string;
} & {
    readonly testingGuidelines: string;
} & {
    readonly securityAndCompliance: string;
} & {
    readonly dependenciesAndEnvironment: string;
} & {
    readonly prAndGitRules: string;
} & {
    readonly documentationStandards: string;
} & {
    readonly commonPatterns: string;
} & {
    readonly agentWorkflow: string;
} & {
    readonly fewShotExamples: string;
}>;
