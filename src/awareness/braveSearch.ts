/**
 * Brave Search API client with caching.
 * Uses BRAVE_API_KEY env var. Gracefully degrades if missing.
 */

import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";
import { WebSearchResult } from "./types";

const BRAVE_SEARCH_URL = "https://api.search.brave.com/res/v1/web/search";

interface BraveSearchOptions {
  cacheDir?: string;
}

/**
 * Generate a cache key from query parameters.
 */
function cacheKey(query: string): string {
  return crypto.createHash("md5").update(query).digest("hex");
}

let lastRequestTime = 0;
const RATE_LIMIT_MS = 1100; // 1.1 seconds to be safe

/**
 * Search Brave API for a query. Returns parsed results.
 * Caches results to disk if cacheDir is provided.
 */
export async function braveSearch(
  query: string,
  options?: BraveSearchOptions
): Promise<WebSearchResult[]> {
  const apiKey = process.env.BRAVE_API_KEY;

  if (!apiKey) {
    // Graceful degradation — detection still works, only web references are skipped
    return [];
  }

  // Check cache first
  if (options?.cacheDir) {
    const cachedFile = path.join(options.cacheDir, `${cacheKey(query)}.json`);
    if (fs.existsSync(cachedFile)) {
      try {
        const cached = JSON.parse(fs.readFileSync(cachedFile, "utf-8"));
        return cached as WebSearchResult[];
      } catch {
        // Invalid cache, continue with search
      }
    }
  }

  try {
    const url = `${BRAVE_SEARCH_URL}?q=${encodeURIComponent(query)}&count=5`;

    const now = Date.now();
    const timeSinceLast = now - lastRequestTime;
    if (timeSinceLast < RATE_LIMIT_MS) {
      await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_MS - timeSinceLast));
    }
    lastRequestTime = Date.now();

    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "Accept-Encoding": "gzip",
        "X-Subscription-Token": apiKey,
      },
    });

    lastRequestTime = Date.now();

    if (!response.ok) {
      const statusText = response.statusText || "Unknown error";
      const errorMsg = `HTTP ${response.status} (${statusText})`;
      if (response.status === 401 || response.status === 403) {
        console.warn(
          `❌ Brave Search API authentication failed (HTTP ${response.status}: ${statusText}).\n` +
            `   Your BRAVE_API_KEY may be invalid or expired.\n` +
            `   Get a valid key at: https://brave.com/search/api/\n` +
            `   Framework detection still works — only web doc references are affected.`
        );
        throw new Error(`Authentication failed ${errorMsg}. Valid API key required.`);
      } else if (response.status === 429) {
        console.warn(
          `⚠️  Brave Search API rate limit exceeded (HTTP 429).\n` +
            `   Query: "${query}"\n` +
            `   Wait a moment and retry, or check your Brave API plan limits.`
        );
        throw new Error(`Rate limit exceeded ${errorMsg}.`);
      } else {
        console.warn(
          `⚠️  Brave Search API returned HTTP ${response.status} (${statusText}) for query: "${query}"`
        );
        throw new Error(`Brave Search API error: ${errorMsg}`);
      }
    }

    const data = (await response.json()) as Record<string, unknown>;
    const webResults =
      ((data.web as Record<string, unknown>)?.results as Array<Record<string, string>>) || [];

    const results: WebSearchResult[] = webResults.slice(0, 5).map((r) => ({
      title: r.title || "",
      url: r.url || "",
      snippet: r.description || "",
    }));

    // Write to cache
    if (options?.cacheDir) {
      fs.mkdirSync(options.cacheDir, { recursive: true });
      const cachedFile = path.join(options.cacheDir, `${cacheKey(query)}.json`);
      fs.writeFileSync(cachedFile, JSON.stringify(results, null, 2), "utf-8");
    }

    return results;
  } catch (error) {
    const errMsg = (error as Error).message;
    if (errMsg.includes("fetch") || errMsg.includes("ENOTFOUND") || errMsg.includes("network")) {
      console.warn(
        `⚠️  Brave Search network error for query "${query}": ${errMsg}\n` +
          `   Check your internet connection. Framework detection is unaffected.`
      );
    } else if (!errMsg.includes("HTTP")) {
      console.warn(`⚠️  Brave Search failed for query "${query}": ${errMsg}`);
    }
    throw error;
  }
}

/**
 * Check if Brave Search is available (API key set).
 */
export function isBraveSearchAvailable(): boolean {
  return !!process.env.BRAVE_API_KEY;
}
