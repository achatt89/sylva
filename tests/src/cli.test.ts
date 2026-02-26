import { describe, it, expect, vi } from "vitest";
import { resolveRepositoryTarget } from "../../src/cli";
import * as path from "path";

vi.mock("readline/promises", () => ({
  createInterface: vi.fn().mockReturnValue({
    question: vi.fn().mockResolvedValue(""),
    close: vi.fn(),
  }),
}));

describe("cli utilities", () => {
  describe("resolveRepositoryTarget", () => {
    it("resolves an explicit github repository URL", async () => {
      const result = await resolveRepositoryTarget({
        githubRepository: "https://github.com/expressjs/express",
      });
      expect(result.repoUrl).toBe("https://github.com/expressjs/express");
      expect(result.repoName).toBe("express");
      expect(result.localPath).toBeNull();
    });

    it("resolves a local repository explicit path", async () => {
      const result = await resolveRepositoryTarget({ localRepository: "./src" });
      expect(result.localPath).toBe(path.resolve("./src"));
      expect(result.repoName).toBe("src");
      expect(result.repoUrl).toBeNull();
    });

    it("resolves a positional repo string as git if it starts with http", async () => {
      const result = await resolveRepositoryTarget({
        repo: "https://github.com/foo/bar.git",
      });
      expect(result.repoUrl).toBe("https://github.com/foo/bar.git");
      expect(result.repoName).toBe("bar"); // stripped .git
      expect(result.localPath).toBeNull();
    });

    it("resolves a positional repo string as local path if it is not a URL", async () => {
      const result = await resolveRepositoryTarget({ repo: "./tests" });
      expect(result.localPath).toBe(path.resolve("./tests"));
      expect(result.repoName).toBe("tests");
      expect(result.repoUrl).toBeNull();
    });
  });
});
