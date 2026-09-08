import type { NextConfig } from "next";

function githubPagesBasePath() {
  const fromEnv = process.env.NEXT_PUBLIC_BASE_PATH?.trim();
  if (fromEnv) {
    return fromEnv.startsWith("/") ? fromEnv.replace(/\/$/, "") : `/${fromEnv}`;
  }

  if (process.env.GITHUB_PAGES !== "true") {
    return "";
  }

  const repo = process.env.GITHUB_REPOSITORY?.split("/")[1] ?? "";
  if (!repo || repo.endsWith(".github.io")) {
    return "";
  }

  return `/${repo}`;
}

const basePath = githubPagesBasePath();

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  ...(basePath ? { basePath, assetPrefix: basePath } : {}),
};

export default nextConfig;
