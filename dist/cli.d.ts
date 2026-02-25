#!/usr/bin/env node
export declare function resolveRepositoryTarget(args: any): Promise<{
    repoUrl: string | null;
    localPath: string | null;
    repoName: string;
}>;
