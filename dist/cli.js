#!/usr/bin/env node
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveRepositoryTarget = resolveRepositoryTarget;
const commander_1 = require("commander");
const dotenv = __importStar(require("dotenv"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const readline = __importStar(require("readline/promises"));
const modelConfig_1 = require("./modelConfig");
const utils_1 = require("./utils");
const modules_1 = require("./modules");
dotenv.config();
function initEnvironment() {
    dotenv.config({ path: path.resolve(process.cwd(), ".env") });
}
async function resolveRepositoryTarget(args) {
    let githubRepo = args.githubRepository;
    let localRepo = args.localRepository;
    if (!githubRepo && !localRepo && args.repo) {
        if (args.repo.startsWith("http") || args.repo.startsWith("git@")) {
            githubRepo = args.repo;
        }
        else {
            localRepo = args.repo;
        }
    }
    if (!githubRepo && !localRepo) {
        const githubEnv = process.env.GITHUB_REPO_URL;
        if (githubEnv) {
            githubRepo = githubEnv;
        }
        else {
            const rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout,
            });
            const answer = await rl.question("Enter absolute path to local repository (or press Enter for current directory): ");
            rl.close();
            localRepo = answer.trim() ? answer.trim() : process.cwd();
        }
    }
    if (githubRepo) {
        const repoUrl = githubRepo.trim();
        let repoName = repoUrl.replace(/\/$/, "").split("/").pop() || "unknown-repo";
        if (repoName.endsWith(".git"))
            repoName = repoName.slice(0, -4);
        return { repoUrl, localPath: null, repoName };
    }
    else {
        const localPath = path.resolve(localRepo);
        if (!fs.existsSync(localPath))
            throw new Error(`Local repository path does not exist: ${localPath}`);
        const repoName = path.basename(localPath);
        return { repoUrl: null, localPath, repoName };
    }
}
async function runPipeline(repoDir, repoName, llmMini, maxIterations) {
    console.log(`\n======================================================`);
    console.log(`🕵️‍♂️    SYLVA / AGENTS.md Generator Pipeline`);
    console.log(`======================================================\n`);
    const sourceTree = (0, utils_1.loadSourceTree)(repoDir);
    const numFiles = Object.keys(sourceTree).length;
    if (numFiles === 0) {
        console.warn("\n⚠️  Warning: The loaded source tree is empty! Check IGNORED_DIRS or ensure the repository contains supported source files.");
    }
    else {
        console.log(`✅ Extracted representation for ${numFiles} top-level file(s)/directory(ies).`);
    }
    const extractor = new modules_1.CodebaseConventionExtractor(maxIterations);
    const extractResult = await extractor.extract(sourceTree);
    console.log(`=> Running the Codebase Analyzer RLM workflow...`);
    const rlmResult = await extractResult.analyzer.forward(llmMini, {
        sourceContext: extractResult.contextString,
    });
    const conventionsMarkdown = await extractor.compileMarkdown(llmMini, rlmResult);
    const creator = new modules_1.AgentsMdCreator();
    const sections = await creator.extractAndCompileSections(llmMini, conventionsMarkdown, repoName);
    const finalAgentsMd = (0, utils_1.compileAgentsMd)(sections, repoName);
    (0, utils_1.saveAgentsToDisk)(repoName, finalAgentsMd);
    console.log("\n======================================================");
    console.log("🎉  AGENTS.md Generation Complete!");
    console.log("======================================================\n");
}
async function main() {
    initEnvironment();
    const program = new commander_1.Command();
    program
        .name("sylva")
        .description("Auto-generate AGENTS.md for your repository using Ax-LLM")
        .version("1.0.0")
        .argument("[repo]", "Absolute path to a local repository to analyze (default)")
        .option("--github-repository <url>", "Public GitHub repository URL to analyze")
        .option("--local-repository <path>", "Absolute path to a local repository to analyze")
        .option("-m, --model <model>", "The LLM model to use (PROVIDER/MODEL)")
        .option("--list-models", "List all supported models and exit")
        .option("-i, --max-iterations <number>", "Max RLM iterations", "35")
        .action(async (repo, options) => {
        if (options.listModels) {
            console.log((0, modelConfig_1.listSupportedModels)());
            process.exit(0);
        }
        const parsedArgs = {
            repo: repo,
            githubRepository: options.githubRepository,
            localRepository: options.localRepository,
            model: options.model,
            maxIterations: parseInt(options.maxIterations, 10),
        };
        try {
            const { repoUrl, localPath, repoName } = await resolveRepositoryTarget(parsedArgs);
            const modelConfig = (0, modelConfig_1.resolveModelConfig)(parsedArgs.model);
            console.log(`Using provider: ${modelConfig.provider} | Model mini: ${modelConfig.model_mini}`);
            const llmMini = (0, modelConfig_1.getLanguageModelService)(modelConfig, true);
            let targetDir = localPath;
            if (repoUrl) {
                targetDir = fs.mkdtempSync(path.join(process.cwd(), `sylva-tmp-${repoName}-`));
                (0, utils_1.cloneRepo)(repoUrl, targetDir);
            }
            if (!targetDir)
                throw new Error("Could not resolve target directory");
            await runPipeline(targetDir, repoName, llmMini, parsedArgs.maxIterations);
            if (repoUrl && targetDir) {
                console.log(`Cleaning up temporary repository dir: ${targetDir}`);
                fs.rmSync(targetDir, { recursive: true, force: true });
            }
        }
        catch (err) {
            console.error(`\n❌ Error occurred: ${err.message}`);
            process.exit(1);
        }
    });
    await program.parseAsync(process.argv);
}
if (require.main === module) {
    main();
}
