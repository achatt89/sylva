/**
 * Shared programmatic constants and integration registries for Sylva.
 */

export interface ModelMetadata {
  provider: string;
  tier: "primary" | "mini";
}

export const PROVIDER_GEMINI = "gemini";
export const PROVIDER_ANTHROPIC = "anthropic";
export const PROVIDER_OPENAI = "openai";

export const MODEL_CATALOG: Record<string, ModelMetadata> = {
  // Google Gemini (2026)
  "gemini/gemini-3.1-pro": { provider: PROVIDER_GEMINI, tier: "primary" },
  "gemini/gemini-3.1-flash": { provider: PROVIDER_GEMINI, tier: "mini" },
  "gemini/gemini-3-deep-think": { provider: PROVIDER_GEMINI, tier: "primary" },

  // Anthropic Claude (2026)
  "anthropic/claude-opus-4.6": { provider: PROVIDER_ANTHROPIC, tier: "primary" },
  "anthropic/claude-sonnet-4.6": { provider: PROVIDER_ANTHROPIC, tier: "primary" },
  "anthropic/claude-sonnet-5": { provider: PROVIDER_ANTHROPIC, tier: "primary" },
  "anthropic/claude-haiku-4.5": { provider: PROVIDER_ANTHROPIC, tier: "mini" },
  "anthropic/claude-haiku-3-20250519": { provider: PROVIDER_ANTHROPIC, tier: "mini" },

  // OpenAI (2026)
  "openai/gpt-5.3": { provider: PROVIDER_OPENAI, tier: "primary" },
  "openai/gpt-5.3-codex": { provider: PROVIDER_OPENAI, tier: "primary" },
  "openai/gpt-5.2": { provider: PROVIDER_OPENAI, tier: "primary" },
  "openai/gpt-4o": { provider: PROVIDER_OPENAI, tier: "primary" },
  "openai/gpt-4o-mini": { provider: PROVIDER_OPENAI, tier: "mini" },
};

export const DEFAULT_MODELS: Record<string, string> = {
  [PROVIDER_GEMINI]: "gemini/gemini-3.1-pro",
  [PROVIDER_ANTHROPIC]: "anthropic/claude-sonnet-4.6",
  [PROVIDER_OPENAI]: "openai/gpt-4o",
};

export const DEFAULT_MINI_MODELS: Record<string, string> = {
  [PROVIDER_GEMINI]: "gemini/gemini-3.1-flash",
  [PROVIDER_ANTHROPIC]: "anthropic/claude-haiku-3-20250519",
  [PROVIDER_OPENAI]: "openai/gpt-4o-mini",
};

export const API_KEY_ENV_VARS: Record<string, string[]> = {
  [PROVIDER_GEMINI]: ["GEMINI_API_KEY", "GOOGLE_API_KEY"],
  [PROVIDER_ANTHROPIC]: ["ANTHROPIC_API_KEY"],
  [PROVIDER_OPENAI]: ["OPENAI_API_KEY"],
};

export const ALLOWED_EXTENSIONS = new Set([
  ".py",
  ".js",
  ".ts",
  ".jsx",
  ".tsx",
  ".vue",
  ".java",
  ".md",
  ".json",
  ".yml",
  ".yaml",
  ".txt",
  ".html",
  ".css",
  ".scss",
  ".less",
  ".c",
  ".cpp",
  ".h",
  ".hpp",
  ".cs",
  ".go",
  ".rb",
  ".php",
  ".rs",
  ".sh",
  ".swift",
  ".kt",
  ".sql",
  ".xml",
  ".toml",
  ".ini",
  ".dart",
  ".scala",
  ".r",
  ".m",
  ".pl",
  ".lock",
  ".cfg",
  ".csproj",
  ".fsproj",
  ".gradle",
]);

export const IGNORED_DIRS = new Set([
  "node_modules",
  "__pycache__",
  "venv",
  "env",
  "dist",
  "build",
  "target",
  "vendor",
  "bin",
  "obj",
  "out",
  "coverage",
  "logs",
  "tmp",
  "temp",
  "packages",
  "pkg",
  ".git",
]);

/**
 * Dependency manifest files that should be hoisted to the top of the serialized
 * source tree so the AI reads them FIRST, preventing framework hallucination.
 */
export const DEPENDENCY_MANIFESTS = new Set([
  "requirements.txt",
  "pyproject.toml",
  "Pipfile",
  "setup.py",
  "setup.cfg",
  "go.mod",
  "Cargo.toml",
  "pom.xml",
  "build.gradle",
  "build.gradle.kts",
  "Gemfile",
  "composer.json",
  "Package.swift",
  "Makefile",
  "Dockerfile",
  "docker-compose.yml",
  "docker-compose.yaml",
  "package.json",
  "openclaw.json",
  "angular.json",
  "workspace.json",
  "global.json",
  "Cargo.lock",
  "go.mod",
]);

export interface IntegrationDef {
  id: string;
  name: string;
  urlPatterns?: string[];
  importPatterns?: string[];
  envPatterns?: string[];
  configPatterns?: string[]; // Match exact config file names like fly.toml
  dockerPatterns?: string[]; // Match strings within Dockerfiles
}

export const INTEGRATIONS: IntegrationDef[] = [
  // E-commerce & Headless
  {
    id: "wix",
    name: "Wix Headless",
    urlPatterns: ["wixapis.com", "wixstatic.com"],
    envPatterns: ["WIX_API_KEY", "WIX_SITE_ID", "WIX_CLIENT_ID"],
  },
  {
    id: "stripe",
    name: "Stripe",
    importPatterns: ["stripe", "@stripe/stripe-js"],
    urlPatterns: ["api.stripe.com"],
    envPatterns: ["STRIPE_SECRET_KEY", "STRIPE_PUBLISHABLE_KEY"],
  },

  // Cloud Providers
  {
    id: "aws",
    name: "AWS",
    importPatterns: ["boto3", "aws-sdk", "@aws-sdk"],
    configPatterns: ["buildspec.yml", "samconfig.toml", "serverless.yml"],
    envPatterns: ["AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY", "AWS_REGION", "AWS_DEFAULT_REGION"],
    dockerPatterns: ["public.ecr.aws", "amazonaws.com"],
  },
  {
    id: "azure",
    name: "Microsoft Azure",
    importPatterns: ["azure", "@azure"],
    urlPatterns: ["windows.net", "azure.com"],
    configPatterns: ["azure-pipelines.yml"],
    envPatterns: ["AZURE_CLIENT_ID", "AZURE_TENANT_ID"],
    dockerPatterns: ["mcr.microsoft.com", "azurecr.io"],
  },
  {
    id: "gcp",
    name: "Google Cloud",
    importPatterns: ["google-cloud", "@google-cloud"],
    urlPatterns: ["googleapis.com"],
    configPatterns: ["app.yaml", "cloudbuild.yaml"],
    envPatterns: ["GOOGLE_APPLICATION_CREDENTIALS"],
    dockerPatterns: ["gcr.io", "pkg.dev"],
  },

  // Hosting & Edge
  {
    id: "vercel",
    name: "Vercel",
    importPatterns: ["@vercel"],
    configPatterns: ["vercel.json"],
    envPatterns: ["VERCEL_URL", "VERCEL_PROJECT_ID"],
  },
  {
    id: "netlify",
    name: "Netlify",
    importPatterns: ["@netlify"],
    configPatterns: ["netlify.toml"],
    envPatterns: ["NETLIFY", "NETLIFY_AUTH_TOKEN"], // Removed generic URL
  },
  {
    id: "cloudflare",
    name: "Cloudflare",
    importPatterns: ["cloudflare", "@cloudflare"],
    configPatterns: ["wrangler.toml"],
    envPatterns: ["CLOUDFLARE_API_TOKEN", "CLOUDFLARE_ACCOUNT_ID"],
  },
  {
    id: "flyio",
    name: "Fly.io",
    configPatterns: ["fly.toml"],
    dockerPatterns: ["flyio", "flyctl"],
  },
  {
    id: "railway",
    name: "Railway",
    configPatterns: ["railway.json", "railway.toml"],
    dockerPatterns: ["railwayapp"],
  },
  {
    id: "render",
    name: "Render",
    configPatterns: ["render.yaml"],
  },
  {
    id: "digitalocean",
    name: "DigitalOcean",
    configPatterns: ["app-spec.yaml", "digitalocean.yaml"],
    dockerPatterns: ["digitalocean"],
  },

  // Firebase
  {
    id: "firebase",
    name: "Firebase",
    importPatterns: ["firebase", "firebase-admin"],
    urlPatterns: ["firebaseio.com", "firebasestorage.googleapis.com"],
    envPatterns: ["FIREBASE_API_KEY", "FIREBASE_PROJECT_ID"],
  },

  // Social & Graph
  {
    id: "instagram-api",
    name: "Instagram Graph API",
    urlPatterns: ["graph.instagram.com", "graph.facebook.com"],
    envPatterns: ["INSTAGRAM_ACCESS_TOKEN", "INSTAGRAM_ACCOUNT_ID"],
  },

  // AI & LLMs
  {
    id: "openai",
    name: "OpenAI",
    importPatterns: ["openai"],
    urlPatterns: ["api.openai.com"],
    envPatterns: ["OPENAI_API_KEY"],
  },
  {
    id: "anthropic",
    name: "Anthropic",
    importPatterns: ["@anthropic-ai", "anthropic"],
    urlPatterns: ["api.anthropic.com"],
    envPatterns: ["ANTHROPIC_API_KEY"],
  },

  // Comms
  {
    id: "twilio",
    name: "Twilio",
    importPatterns: ["twilio"],
    urlPatterns: ["api.twilio.com"],
    envPatterns: ["TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN"],
  },
  {
    id: "sendgrid",
    name: "SendGrid",
    importPatterns: ["sendgrid", "@sendgrid"],
    envPatterns: ["SENDGRID_API_KEY"],
  },

  // Databases & BaaS
  {
    id: "mongodb",
    name: "MongoDB",
    importPatterns: ["mongoose", "pymongo", "mongodb"],
    urlPatterns: ["mongodb.net", "mongodb+srv"],
    envPatterns: ["MONGO_URI", "MONGODB_URI"],
  },
  {
    id: "redis",
    name: "Redis",
    importPatterns: ["redis", "ioredis"],
    urlPatterns: ["redis://", "rediss://"],
    envPatterns: ["REDIS_URL"],
  },
  {
    id: "supabase",
    name: "Supabase",
    importPatterns: ["supabase", "@supabase/supabase-js"],
    urlPatterns: ["supabase.co"],
    envPatterns: ["SUPABASE_URL", "SUPABASE_ANON_KEY"],
  },
];

// Reusable array of generic source file extensions to scan
export const SOURCE_EXTENSIONS = [
  ".py",
  ".ts",
  ".js",
  ".go",
  ".rs",
  ".java",
  ".rb",
  ".php",
  ".tsx",
  ".jsx",
  ".cs",
  ".cpp",
  ".c",
  ".swift",
  ".kt",
];

// Shared directories to skip matching globally (used by manifest and source scanners)
export const SCAN_IGNORE_DIRS = [
  ".git",
  "node_modules",
  "__pycache__",
  "venv",
  ".venv",
  "env",
  ".env",
  "dist",
  "build",
  "target",
  "vendor",
  "bin",
  "obj",
  "out",
  ".output",
  "coverage",
  "logs",
  "tmp",
  "temp",
  ".idea",
  ".vscode",
  ".next",
  ".nuxt",
  ".svelte-kit",
  ".angular",
  ".DS_Store",
  "public",
];

// NEVER extract .env files
export const ALWAYS_IGNORE_FILES = [
  ".env",
  ".env.local",
  ".env.development",
  ".env.production",
  ".env.test",
];

// Exact filenames to match as manifests
export const MANIFEST_EXACT_NAMES = [
  "package.json",
  "package-lock.json",
  "yarn.lock",
  "pnpm-lock.yaml",
  "openclaw.json",
  ".openclaw.json",
  "angular.json",
  "workspace.json",
  "project.json",
  "pyproject.toml",
  "requirements.txt",
  "poetry.lock",
  "Pipfile",
  "Pipfile.lock",
  "setup.cfg",
  "setup.py",
  "pom.xml",
  "build.gradle",
  "build.gradle.kts",
  "settings.gradle",
  "settings.gradle.kts",
  "gradle.properties",
  "go.mod",
  "go.sum",
  "Cargo.toml",
  "Cargo.lock",
  "global.json",
  "packages.lock.json",
  "Dockerfile",
  "docker-compose.yml",
  "docker-compose.yaml",
  "Makefile",
  ".gitlab-ci.yml",
];

// File extension patterns for manifests (e.g. *.csproj)
export const MANIFEST_EXTENSION_PATTERNS = [".csproj", ".fsproj", ".vbproj"];

// Maximum file size in characters to read for manifests
export const MAX_MANIFEST_FILE_SIZE = 500_000;

/** Confidence scoring rules mapped by framework ID */
export const CONFIDENCE_SCORES: Record<string, number> = {
  orchestrator: 95,
  angular: 85,
  react: 80,
  nextjs: 85,
  vue: 80,
  nuxt: 85,
  svelte: 80,
  sveltekit: 85,
  express: 75,
  nestjs: 85,
  fastify: 75,
  django: 85,
  flask: 75,
  fastapi: 80,
  "spring-boot": 90,
  spring: 80,
  "java-maven": 70,
  "java-gradle": 70,
  dotnet: 80,
  "aspnet-core": 85,
  go: 80,
  rust: 80,
  "actix-web": 85,
  axum: 85,
  nodejs: 60,
  python: 60,
  typescript: 65,
  docker: 50,
};

export const NPM_FRAMEWORKS: {
  depPattern: string | RegExp;
  frameworkId: string;
  frameworkName: string;
}[] = [
  { depPattern: "@angular/core", frameworkId: "angular", frameworkName: "Angular" },
  { depPattern: "react", frameworkId: "react", frameworkName: "React" },
  { depPattern: "react-dom", frameworkId: "react-dom", frameworkName: "React DOM" },
  { depPattern: "next", frameworkId: "nextjs", frameworkName: "Next.js" },
  { depPattern: "vue", frameworkId: "vue", frameworkName: "Vue.js" },
  { depPattern: "nuxt", frameworkId: "nuxt", frameworkName: "Nuxt" },
  { depPattern: "@sveltejs/kit", frameworkId: "sveltekit", frameworkName: "SvelteKit" },
  { depPattern: "svelte", frameworkId: "svelte", frameworkName: "Svelte" },
  { depPattern: "express", frameworkId: "express", frameworkName: "Express" },
  { depPattern: "@nestjs/core", frameworkId: "nestjs", frameworkName: "NestJS" },
  { depPattern: "fastify", frameworkId: "fastify", frameworkName: "Fastify" },
  { depPattern: "koa", frameworkId: "koa", frameworkName: "Koa" },
  { depPattern: "typescript", frameworkId: "typescript", frameworkName: "TypeScript" },
  { depPattern: "@ax-llm/ax", frameworkId: "ax-llm", frameworkName: "Ax-LLM" },
  { depPattern: "electron", frameworkId: "electron", frameworkName: "Electron" },
  { depPattern: "react-native", frameworkId: "react-native", frameworkName: "React Native" },
  { depPattern: "tailwindcss", frameworkId: "tailwindcss", frameworkName: "Tailwind CSS" },
  { depPattern: "vite", frameworkId: "vite", frameworkName: "Vite" },
  { depPattern: "webpack", frameworkId: "webpack", frameworkName: "Webpack" },
  { depPattern: "esbuild", frameworkId: "esbuild", frameworkName: "esbuild" },
];

export const PYTHON_FRAMEWORKS: { pkg: string; frameworkId: string; frameworkName: string }[] = [
  { pkg: "django", frameworkId: "django", frameworkName: "Django" },
  { pkg: "flask", frameworkId: "flask", frameworkName: "Flask" },
  { pkg: "fastapi", frameworkId: "fastapi", frameworkName: "FastAPI" },
  { pkg: "uvicorn", frameworkId: "uvicorn", frameworkName: "Uvicorn" },
  { pkg: "starlette", frameworkId: "starlette", frameworkName: "Starlette" },
  { pkg: "celery", frameworkId: "celery", frameworkName: "Celery" },
  { pkg: "sqlalchemy", frameworkId: "sqlalchemy", frameworkName: "SQLAlchemy" },
  { pkg: "pandas", frameworkId: "pandas", frameworkName: "Pandas" },
  { pkg: "numpy", frameworkId: "numpy", frameworkName: "NumPy" },
  { pkg: "tensorflow", frameworkId: "tensorflow", frameworkName: "TensorFlow" },
  { pkg: "torch", frameworkId: "pytorch", frameworkName: "PyTorch" },
  { pkg: "scikit-learn", frameworkId: "scikit-learn", frameworkName: "scikit-learn" },
  { pkg: "pytest", frameworkId: "pytest", frameworkName: "pytest" },
  { pkg: "gunicorn", frameworkId: "gunicorn", frameworkName: "Gunicorn" },
];

export const JAVA_FRAMEWORKS: {
  groupArtifact: string;
  frameworkId: string;
  frameworkName: string;
}[] = [
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

export const GO_FRAMEWORKS: { module: string; frameworkId: string; frameworkName: string }[] = [
  { module: "github.com/gin-gonic/gin", frameworkId: "gin", frameworkName: "Gin" },
  { module: "github.com/labstack/echo", frameworkId: "echo", frameworkName: "Echo" },
  { module: "github.com/gofiber/fiber", frameworkId: "fiber", frameworkName: "Fiber" },
  { module: "github.com/gorilla/mux", frameworkId: "gorilla-mux", frameworkName: "Gorilla Mux" },
  { module: "gorm.io/gorm", frameworkId: "gorm", frameworkName: "GORM" },
  { module: "github.com/stretchr/testify", frameworkId: "testify", frameworkName: "Testify" },
  { module: "google.golang.org/grpc", frameworkId: "grpc-go", frameworkName: "gRPC-Go" },
];

export const RUST_FRAMEWORKS: { crate: string; frameworkId: string; frameworkName: string }[] = [
  { crate: "actix-web", frameworkId: "actix-web", frameworkName: "Actix Web" },
  { crate: "rocket", frameworkId: "rocket", frameworkName: "Rocket" },
  { crate: "axum", frameworkId: "axum", frameworkName: "Axum" },
  { crate: "tokio", frameworkId: "tokio", frameworkName: "Tokio" },
  { crate: "serde", frameworkId: "serde", frameworkName: "Serde" },
  { crate: "diesel", frameworkId: "diesel", frameworkName: "Diesel" },
  { crate: "sqlx", frameworkId: "sqlx", frameworkName: "SQLx" },
  { crate: "warp", frameworkId: "warp", frameworkName: "Warp" },
];
