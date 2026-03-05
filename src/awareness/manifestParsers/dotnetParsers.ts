/**
 * .NET manifest parsers.
 * Handles *.csproj files and global.json.
 */

import * as fs from "fs";
import * as path from "path";
import { Signal, ManifestFile, VersionInfo } from "../types";

/**
 * Parse a .csproj file (MSBuild XML format)
 */
export function parseCsproj(manifest: ManifestFile): Signal[] {
    const signals: Signal[] = [];
    const content = fs.readFileSync(manifest.absolutePath, "utf-8");
    const rootPath = path.dirname(manifest.relativePath) || ".";

    signals.push({
        kind: "framework",
        frameworkId: "dotnet",
        frameworkName: ".NET",
        evidence: {
            file: manifest.relativePath,
            reason: `${manifest.filename} project file found`,
        },
        scope: { pathRoot: rootPath },
    });

    // Extract TargetFramework
    const tfMatch = content.match(/<TargetFramework>([^<]+)<\/TargetFramework>/);
    if (tfMatch) {
        signals.push({
            kind: "version",
            frameworkId: "dotnet",
            frameworkName: ".NET",
            version: { value: tfMatch[1], certainty: "exact", sourceFile: manifest.relativePath },
            evidence: {
                file: manifest.relativePath,
                reason: "TargetFramework specified in csproj",
                excerpt: `<TargetFramework>${tfMatch[1]}</TargetFramework>`,
            },
            scope: { pathRoot: rootPath },
        });
    }

    // Extract PackageReference versions
    const pkgRefRegex = /<PackageReference\s+Include="([^"]+)"\s+Version="([^"]+)"/g;
    let m;
    while ((m = pkgRefRegex.exec(content)) !== null) {
        const pkgName = m[1];
        const version = m[2];

        const isPinned = /^\d+\.\d+/.test(version) && !/[*[\]]/.test(version);
        const versionInfo: VersionInfo = isPinned
            ? { value: version, certainty: "exact", sourceFile: manifest.relativePath }
            : {
                value: version,
                certainty: "ambiguous",
                sourceFile: manifest.relativePath,
                notes: `Version range: ${version}`,
            };

        // Check for known .NET frameworks
        let frameworkId = `nuget-${pkgName.toLowerCase()}`;
        let frameworkName = pkgName;

        if (pkgName.startsWith("Microsoft.AspNetCore") || pkgName.startsWith("Microsoft.Extensions")) {
            frameworkId = "aspnet-core";
            frameworkName = "ASP.NET Core";
        } else if (pkgName.startsWith("Microsoft.EntityFrameworkCore")) {
            frameworkId = "ef-core";
            frameworkName = "Entity Framework Core";
        }

        signals.push({
            kind: "framework",
            frameworkId,
            frameworkName,
            version: versionInfo,
            evidence: {
                file: manifest.relativePath,
                reason: `NuGet package '${pkgName}' referenced in csproj`,
                excerpt: m[0],
            },
            scope: { pathRoot: rootPath },
        });
    }

    return signals;
}

/**
 * Parse global.json (.NET SDK version pinning)
 */
export function parseGlobalJson(manifest: ManifestFile): Signal[] {
    const signals: Signal[] = [];
    const content = fs.readFileSync(manifest.absolutePath, "utf-8");
    const rootPath = path.dirname(manifest.relativePath) || ".";

    try {
        const config = JSON.parse(content);
        if (config.sdk?.version) {
            signals.push({
                kind: "version",
                frameworkId: "dotnet-sdk",
                frameworkName: ".NET SDK",
                version: {
                    value: config.sdk.version,
                    certainty: "exact",
                    sourceFile: manifest.relativePath,
                },
                evidence: {
                    file: manifest.relativePath,
                    reason: ".NET SDK version pinned in global.json",
                    excerpt: `"version": "${config.sdk.version}"`,
                },
                scope: { pathRoot: rootPath },
            });
        }
    } catch (error) {
        console.warn(
            `⚠️  Could not parse ${manifest.relativePath}: ${(error as Error).message}\n` +
            `   .NET SDK version detection skipped for this file. Fix the JSON syntax to enable it.`
        );
    }

    return signals;
}
