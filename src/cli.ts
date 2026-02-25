#!/usr/bin/env node

import { Command } from "commander";
import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";
import * as readline from "readline/promises";

import { resolveModelConfig, getLanguageModelService, listSupportedModels } from "./modelConfig";
import { cloneRepo, loadSourceTree, saveAgentsToDisk, compileAgentsMd } from "./utils";
import { CodebaseConventionExtractor, AgentsMdCreator } from "./modules";

function initEnvironment() {
  const envPath = path.resolve(process.cwd(), ".env");
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath, override: true });
  }
}

export async function resolveRepositoryTarget(args: any): Promise<{
  repoUrl: string | null;
  localPath: string | null;
  repoName: string;
}> {
  let githubRepo = args.githubRepository;
  let localRepo = args.localRepository;

  if (!githubRepo && !localRepo && args.repo) {
    if (args.repo.startsWith("http") || args.repo.startsWith("git@")) {
      githubRepo = args.repo;
    } else {
      localRepo = args.repo;
    }
  }

  if (!githubRepo && !localRepo) {
    const githubEnv = process.env.GITHUB_REPO_URL;
    if (githubEnv) {
      githubRepo = githubEnv;
    } else {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });
      const answer = await rl.question(
        "Enter absolute path to local repository (or press Enter for current directory): "
      );
      rl.close();
      localRepo = answer.trim() ? answer.trim() : process.cwd();
    }
  }

  if (githubRepo) {
    const repoUrl = githubRepo.trim();
    let repoName = repoUrl.replace(/\/$/, "").split("/").pop() || "unknown-repo";
    if (repoName.endsWith(".git")) repoName = repoName.slice(0, -4);
    return { repoUrl, localPath: null, repoName };
  } else {
    const localPath = path.resolve(localRepo);
    if (!fs.existsSync(localPath))
      throw new Error(`Local repository path does not exist: ${localPath}`);
    const repoName = path.basename(localPath);
    return { repoUrl: null, localPath, repoName };
  }
}

async function runPipeline(
  repoDir: string,
  repoName: string,
  llmPrimary: any,
  llmMini: any,
  maxIterations: number
) {
  console.log(`\n======================================================`);
  console.log(`🕵️‍♂️    SYLVA / AGENTS.md Generator Pipeline`);
  console.log(`======================================================\n`);

  const sourceTree = loadSourceTree(repoDir);
  const numFiles = Object.keys(sourceTree).length;

  if (numFiles === 0) {
    console.warn(
      "\n⚠️  Warning: The loaded source tree is empty! Check IGNORED_DIRS or ensure the repository contains supported source files."
    );
  } else {
    console.log(`✅ Extracted representation for ${numFiles} top-level file(s)/directory(ies).`);
  }

  const extractor = new CodebaseConventionExtractor(maxIterations);
  const extractResult = await extractor.extract(sourceTree);

  // Use the PRIMARY model for RLM analysis (needs strong reasoning to avoid hallucination)
  console.log(`=> Running the Codebase Analyzer RLM workflow...`);
  const rlmResult = await extractResult.analyzer.forward(llmPrimary, {
    sourceContext: extractResult.contextString,
  });

  // Use the PRIMARY model for compiling conventions (needs to accurately synthesize)
  const conventionsMarkdown = await extractor.compileMarkdown(llmPrimary, rlmResult);

  // Use MINI model for section extraction (cheaper, deterministic task)
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
        console.log(listSupportedModels());
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
        const modelConfig = resolveModelConfig(parsedArgs.model);
        console.log(
          `Using provider: ${modelConfig.provider} | Primary: ${modelConfig.model} | Mini: ${modelConfig.model_mini}`
        );
        const llmPrimary = getLanguageModelService(modelConfig, false);
        const llmMini = getLanguageModelService(modelConfig, true);
        let targetDir = localPath;

        if (repoUrl) {
          targetDir = fs.mkdtempSync(path.join(process.cwd(), `sylva-tmp-${repoName}-`));
          cloneRepo(repoUrl, targetDir);
        }

        if (!targetDir) throw new Error("Could not resolve target directory");

        await runPipeline(targetDir, repoName, llmPrimary, llmMini, parsedArgs.maxIterations);

        if (repoUrl && targetDir) {
          console.log(`Cleaning up temporary repository dir: ${targetDir}`);
          fs.rmSync(targetDir, { recursive: true, force: true });
        }
      } catch (err: any) {
        console.error(`\n❌ Error occurred: ${err.message}`);
        process.exit(1);
      }
    });

  await program.parseAsync(process.argv);
}

if (require.main === module) {
  main();
}
