#!/usr/bin/env node

import { Command } from 'commander';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import { AxAIOpenAI, AxAIGoogleGemini, AxAIAzureOpenAI } from '@ax-llm/ax';

import {
    cloneRepo,
    loadSourceTree,
    saveAgentsToDisk,
    compileAgentsMd
} from './utils';
import {
    CodebaseConventionExtractor,
    AgentsMdCreator
} from './modules';

dotenv.config();

function initEnvironment() {
    if (!process.env.OPENAI_API_KEY && !process.env.GEMINI_API_KEY && !process.env.AZURE_OPENAI_API_KEY) {
        console.warn("⚠️  WARNING: No API keys found (OPENAI_API_KEY, GEMINI_API_KEY, etc.) in environment or .env file.");
    }
}

function resolveRepositoryTarget(args: any): { repoUrl: string | null, localPath: string | null, repoName: string } {
    let repoUrl: string | null = null;
    let localPath: string | null = null;
    let repoName: string;

    if (args.repo && (args.repo.startsWith('http') || args.repo.startsWith('git@'))) {
        repoUrl = args.repo;
        // Basic extraction of repo name
        repoName = args.repo.split('/').pop()?.replace('.git', '') || 'unknown-repo';
    } else if (args.repo) {
        localPath = path.resolve(args.repo);
        repoName = path.basename(localPath);
    } else {
        localPath = process.cwd();
        repoName = path.basename(localPath);
    }

    return { repoUrl, localPath, repoName };
}

function setupLanguageModel(modelName: string) {
    if (modelName.toLowerCase().includes('gemini')) {
        return new AxAIGoogleGemini({ apiKey: process.env.GEMINI_API_KEY as string, config: { model: modelName as any } });
    } else if (modelName.toLowerCase().includes('azure')) {
        return new AxAIAzureOpenAI({
            apiKey: process.env.AZURE_OPENAI_API_KEY as string,
            resourceName: process.env.AZURE_OPENAI_RESOURCE_NAME as string || 'default_resource',
            deploymentName: process.env.AZURE_OPENAI_DEPLOYMENT_NAME as string || 'default_deployment'
        });
    } else {
        return new AxAIOpenAI({ apiKey: process.env.OPENAI_API_KEY as string, config: { model: modelName as any } });
    }
}

async function runPipeline(repoDir: string, repoName: string, llmMini: any, maxIterations: number) {
    console.log(`\n======================================================`);
    console.log(`🕵️‍♂️    SYLVA / AGENTS.md Generator Pipeline`);
    console.log(`======================================================\n`);

    const sourceTree = loadSourceTree(repoDir);
    const numFiles = Object.keys(sourceTree).length;

    if (numFiles === 0) {
        console.warn("\n⚠️  Warning: The loaded source tree is empty! Check IGNORED_DIRS or ensure the repository contains supported source files.");
    } else {
        console.log(`✅ Extracted representation for ${numFiles} top-level file(s)/directory(ies).`);
    }

    const extractor = new CodebaseConventionExtractor(maxIterations);
    const extractResult = await extractor.extract(sourceTree);

    console.log(`=> Running the Codebase Analyzer RLM workflow...`);
    const rlmResult = await extractResult.analyzer.forward(llmMini, { sourceContext: extractResult.contextString });

    const conventionsMarkdown = await extractor.compileMarkdown(llmMini, rlmResult);

    const creator = new AgentsMdCreator();
    const sections = await creator.extractAndCompileSections(llmMini, conventionsMarkdown, repoName);
    const finalAgentsMd = compileAgentsMd(sections, repoName);

    saveAgentsToDisk(repoName, finalAgentsMd);

    console.log("\n======================================================");
    console.log("🎉  AGENTS.md Generation Complete!");
    console.log("======================================================\n");
}

async function main() {
    initEnvironment();

    const program = new Command();

    program
        .name('sylva')
        .description('Auto-generate AGENTS.md for your repository using Ax-LLM')
        .version('1.0.0')
        .argument('[repo]', 'Git URL or local directory path')
        .option('-m, --model <model>', 'The LLM model to use', 'gpt-4o-mini')
        .option('-i, --max-iterations <number>', 'Max RLM iterations', '35')
        .action(async (repo, options) => {
            const parsedArgs = {
                repo: repo,
                model: options.model,
                maxIterations: parseInt(options.maxIterations, 10)
            };

            const { repoUrl, localPath, repoName } = resolveRepositoryTarget(parsedArgs);
            const llmMini = setupLanguageModel(parsedArgs.model);
            let targetDir = localPath;

            try {
                if (repoUrl) {
                    targetDir = fs.mkdtempSync(path.join(process.cwd(), `sylva-tmp-${repoName}-`));
                    cloneRepo(repoUrl, targetDir);
                }

                if (!targetDir) throw new Error("Could not resolve target directory");

                await runPipeline(targetDir, repoName, llmMini, parsedArgs.maxIterations);

            } catch (err: any) {
                console.error(`\n❌ Error occurred: ${err.message}`);
                process.exit(1);
            } finally {
                if (repoUrl && targetDir) {
                    console.log(`Cleaning up temporary repository dir: ${targetDir}`);
                    fs.rmSync(targetDir, { recursive: true, force: true });
                }
            }
        });

    await program.parseAsync(process.argv);
}

if (require.main === module) {
    main();
}
