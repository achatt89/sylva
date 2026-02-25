import { describe, it, expect, vi } from 'vitest';
import { loadSourceTree, compileAgentsMd, AgentsMdSections, saveAgentsToDisk } from './utils';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

describe('Sylva utils', () => {

    describe('loadSourceTree', () => {
        it('ignores standard ignored directories like node_modules', () => {
            const testDir = path.join(__dirname, '..', 'temp-test-dir');
            if (fs.existsSync(testDir)) fs.rmSync(testDir, { recursive: true, force: true });
            fs.mkdirSync(testDir, { recursive: true });

            fs.mkdirSync(path.join(testDir, 'node_modules'));
            fs.writeFileSync(path.join(testDir, 'node_modules', 'ignored.ts'), 'console.log("ignore");');

            fs.mkdirSync(path.join(testDir, 'src'));
            fs.writeFileSync(path.join(testDir, 'src', 'valid.ts'), 'export const a = 1;');

            try {
                const tree = loadSourceTree(testDir);
                // "node_modules" should not be in the keys
                expect(Object.keys(tree)).not.toContain('node_modules');

                // "src" should be parsed
                expect(tree['src']).toBeDefined();
                expect((tree['src'] as any)['valid.ts']).toBe('export const a = 1;');
            } finally {
                fs.rmSync(testDir, { recursive: true, force: true });
            }
        });
    });

    describe('compileAgentsMd', () => {
        it('correctly maps and concatenates markdown sections', () => {
            const sections: AgentsMdSections = {
                projectOverview: "This is a great project.",
                codeStyle: "We use spaces, not tabs.",
                techStack: "TypeScript"
            };

            const compiled = compileAgentsMd(sections, 'my-repo');

            expect(compiled).toContain('# AGENTS.md — my-repo');
            expect(compiled).toContain('## Project Overview');
            expect(compiled).toContain('This is a great project.');
            expect(compiled).toContain('## Code Style');
            expect(compiled).toContain('We use spaces, not tabs.');
            expect(compiled).toContain('## Tech Stack');
            expect(compiled).toContain('TypeScript');

            // Ensure unspecified properties are omitted
            expect(compiled).not.toContain('## Architecture');
        });
    });

    describe('saveAgentsToDisk', () => {
        it('cleans up markdown wrapper blocks automatically', () => {
            const tempDir = path.join(__dirname, '..', 'projects');
            if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

            const rawOutput = "```markdown\n# Hello \nWorld\n```\n";

            saveAgentsToDisk('test-repo', rawOutput, tempDir);

            const expectedFile = path.join(tempDir, 'test-repo', 'AGENTS.md');
            expect(fs.existsSync(expectedFile)).toBe(true);

            const content = fs.readFileSync(expectedFile, 'utf8');
            expect(content).toBe('# Hello \nWorld');

            fs.rmSync(path.join(tempDir, 'test-repo'), { recursive: true, force: true });
        });
    });
});
