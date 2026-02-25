export type TreeType = string | {
    [key: string]: TreeType;
};
/**
 * Recursively load the source tree into a nested dictionary,
 * skipping ignored directories and unsupported extensions to save LLM context.
 */
export declare function loadSourceTree(rootDir: string): {
    [key: string]: TreeType;
};
/**
 * Clones a Git repository to the specified destination handling child_process execution.
 */
export declare function cloneRepo(repoUrl: string, destDir: string): void;
/**
 * Saves compiled AGENTS.md back to disk on a standardized path.
 */
export declare function saveAgentsToDisk(repoName: string, agentsContent: string, baseDir?: string): void;
export interface AgentsMdSections {
    projectOverview?: string;
    agentPersona?: string;
    techStack?: string;
    architecture?: string;
    codeStyle?: string;
    antiPatternsAndRestrictions?: string;
    databaseAndState?: string;
    errorHandlingAndLogging?: string;
    testingCommands?: string;
    testingGuidelines?: string;
    securityAndCompliance?: string;
    dependenciesAndEnvironment?: string;
    prAndGitRules?: string;
    documentationStandards?: string;
    commonPatterns?: string;
    agentWorkflow?: string;
    fewShotExamples?: string;
}
/**
 * Joins evaluated section variables together into the uniform AGENTS.md map.
 */
export declare function compileAgentsMd(sections: AgentsMdSections, repoName: string): string;
