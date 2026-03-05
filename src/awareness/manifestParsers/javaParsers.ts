/**
 * Java/JVM manifest parsers.
 * Handles pom.xml and build.gradle(.kts) with regex-based parsing.
 */

import * as fs from "fs";
import * as path from "path";
import { Signal, ManifestFile, VersionInfo } from "../types";

/** Known Java frameworks */
const JAVA_FRAMEWORKS: { groupArtifact: string; frameworkId: string; frameworkName: string }[] = [
  {
    groupArtifact: "org.springframework.boot",
    frameworkId: "spring-boot",
    frameworkName: "Spring Boot",
  },
  {
    groupArtifact: "org.springframework",
    frameworkId: "spring",
    frameworkName: "Spring Framework",
  },
  { groupArtifact: "io.quarkus", frameworkId: "quarkus", frameworkName: "Quarkus" },
  { groupArtifact: "io.micronaut", frameworkId: "micronaut", frameworkName: "Micronaut" },
  { groupArtifact: "org.hibernate", frameworkId: "hibernate", frameworkName: "Hibernate" },
  { groupArtifact: "junit", frameworkId: "junit", frameworkName: "JUnit" },
  { groupArtifact: "org.junit", frameworkId: "junit5", frameworkName: "JUnit 5" },
  { groupArtifact: "org.apache.kafka", frameworkId: "kafka", frameworkName: "Apache Kafka" },
];

/**
 * Parse pom.xml (Maven)
 */
export function parsePomXml(manifest: ManifestFile): Signal[] {
  const signals: Signal[] = [];
  const content = fs.readFileSync(manifest.absolutePath, "utf-8");
  const rootPath = path.dirname(manifest.relativePath) || ".";

  signals.push({
    kind: "framework",
    frameworkId: "java-maven",
    frameworkName: "Java (Maven)",
    evidence: {
      file: manifest.relativePath,
      reason: "pom.xml found",
    },
    scope: { pathRoot: rootPath },
  });

  // Extract properties for version resolution
  const properties: Record<string, string> = {};
  const propsMatch = content.match(/<properties>([\s\S]*?)<\/properties>/);
  if (propsMatch) {
    const propRegex = /<([a-zA-Z0-9._-]+)>([^<]+)<\/\1>/g;
    let m;
    while ((m = propRegex.exec(propsMatch[1])) !== null) {
      properties[m[1]] = m[2];
    }
  }

  // Extract Java version
  const javaVersion = properties["java.version"] || properties["maven.compiler.source"];
  if (javaVersion) {
    signals.push({
      kind: "version",
      frameworkId: "java",
      frameworkName: "Java",
      version: { value: javaVersion, certainty: "exact", sourceFile: manifest.relativePath },
      evidence: {
        file: manifest.relativePath,
        reason: "Java version specified in pom.xml properties",
        excerpt: `java.version = ${javaVersion}`,
      },
      scope: { pathRoot: rootPath },
    });
  }

  // Extract parent (Spring Boot parent, etc.)
  const parentMatch = content.match(
    /<parent>[\s\S]*?<groupId>([^<]+)<\/groupId>[\s\S]*?<version>([^<]+)<\/version>[\s\S]*?<\/parent>/
  );
  if (parentMatch) {
    const parentGroup = parentMatch[1];
    const parentVersion = parentMatch[2];
    const framework = JAVA_FRAMEWORKS.find((f) => parentGroup.includes(f.groupArtifact));
    if (framework) {
      const resolvedVersion = parentVersion.startsWith("${")
        ? properties[parentVersion.slice(2, -1)]
        : parentVersion;
      const versionInfo: VersionInfo = resolvedVersion
        ? { value: resolvedVersion, certainty: "exact", sourceFile: manifest.relativePath }
        : {
            certainty: "ambiguous",
            sourceFile: manifest.relativePath,
            notes: `Unresolved property: ${parentVersion}`,
          };

      signals.push({
        kind: "framework",
        frameworkId: framework.frameworkId,
        frameworkName: framework.frameworkName,
        version: versionInfo,
        evidence: {
          file: manifest.relativePath,
          reason: `Parent POM references ${framework.frameworkName}`,
          excerpt: `<groupId>${parentGroup}</groupId> <version>${parentVersion}</version>`,
        },
        scope: { pathRoot: rootPath },
      });
    }
  }

  // Extract dependencies
  const depRegex =
    /<dependency>\s*<groupId>([^<]+)<\/groupId>\s*<artifactId>([^<]+)<\/artifactId>(?:\s*<version>([^<]+)<\/version>)?/g;
  let depMatch;
  while ((depMatch = depRegex.exec(content)) !== null) {
    const groupId = depMatch[1];
    const artifactId = depMatch[2];
    const version = depMatch[3];

    const framework = JAVA_FRAMEWORKS.find((f) => groupId.includes(f.groupArtifact));
    if (framework) {
      let versionInfo: VersionInfo;
      if (version) {
        const resolvedVersion = version.startsWith("${")
          ? properties[version.slice(2, -1)]
          : version;
        versionInfo = resolvedVersion
          ? { value: resolvedVersion, certainty: "exact", sourceFile: manifest.relativePath }
          : {
              certainty: "ambiguous",
              sourceFile: manifest.relativePath,
              notes: `Unresolved: ${version}`,
            };
      } else {
        versionInfo = {
          certainty: "unknown",
          sourceFile: manifest.relativePath,
          notes: "Version managed by parent/BOM",
        };
      }

      signals.push({
        kind: "framework",
        frameworkId: framework.frameworkId,
        frameworkName: framework.frameworkName,
        version: versionInfo,
        evidence: {
          file: manifest.relativePath,
          reason: `Dependency ${groupId}:${artifactId} in pom.xml`,
          excerpt: `<groupId>${groupId}</groupId> <artifactId>${artifactId}</artifactId>`,
        },
        scope: { pathRoot: rootPath },
      });
    }
  }

  return signals;
}

/**
 * Parse build.gradle or build.gradle.kts (Gradle)
 */
export function parseBuildGradle(manifest: ManifestFile): Signal[] {
  const signals: Signal[] = [];
  const content = fs.readFileSync(manifest.absolutePath, "utf-8");
  const rootPath = path.dirname(manifest.relativePath) || ".";
  const isKts = manifest.filename.endsWith(".kts");

  signals.push({
    kind: "framework",
    frameworkId: "java-gradle",
    frameworkName: `Java (Gradle${isKts ? " KTS" : ""})`,
    evidence: {
      file: manifest.relativePath,
      reason: `${manifest.filename} found`,
    },
    scope: { pathRoot: rootPath },
  });

  // Detect Spring Boot plugin
  const springBootPlugin = content.match(
    /id\s*[("']org\.springframework\.boot[)"']\s*version\s*[("']([^)"']+)[)"']/
  );
  if (springBootPlugin) {
    signals.push({
      kind: "framework",
      frameworkId: "spring-boot",
      frameworkName: "Spring Boot",
      version: {
        value: springBootPlugin[1],
        certainty: "exact",
        sourceFile: manifest.relativePath,
      },
      evidence: {
        file: manifest.relativePath,
        reason: "Spring Boot Gradle plugin found",
        excerpt: springBootPlugin[0],
      },
      scope: { pathRoot: rootPath },
    });
  }

  // Detect dependencies with versions
  const depRegex =
    /(?:implementation|api|compile|testImplementation)\s*[("']([^)"':]+):([^)"':]+):([^)"']+)[)"']/g;
  let m;
  while ((m = depRegex.exec(content)) !== null) {
    const groupId = m[1];
    const version = m[3];

    const framework = JAVA_FRAMEWORKS.find((f) => groupId.includes(f.groupArtifact));
    if (framework) {
      signals.push({
        kind: "framework",
        frameworkId: framework.frameworkId,
        frameworkName: framework.frameworkName,
        version: { value: version, certainty: "exact", sourceFile: manifest.relativePath },
        evidence: {
          file: manifest.relativePath,
          reason: `Gradle dependency references ${framework.frameworkName}`,
          excerpt: m[0],
        },
        scope: { pathRoot: rootPath },
      });
    }
  }

  return signals;
}
