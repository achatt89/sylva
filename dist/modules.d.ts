import { AgentsMdSections, TreeType } from "./utils";
export declare class CodebaseConventionExtractor {
    private maxIterations;
    constructor(maxIterations?: number);
    extract(sourceTree: {
        [key: string]: TreeType;
    }): Promise<{
        analyzer: import("@ax-llm/ax").AxAgent<{
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
        contextString: string;
    }>;
    compileMarkdown(llm: any, extractResult: any): Promise<string>;
}
export declare class AgentsMdCreator {
    extractAndCompileSections(llm: any, conventionsMarkdown: string, repositoryName: string): Promise<AgentsMdSections>;
}
