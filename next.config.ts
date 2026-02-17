import type { NextConfig } from "next";

const isGithubActions = process.env.GITHUB_ACTIONS === "true";
const repositoryName = process.env.GITHUB_REPOSITORY?.split("/")[1] ?? "";
const isUserPagesRepo = repositoryName.endsWith(".github.io");
const basePath =
  isGithubActions && repositoryName && !isUserPagesRepo
    ? `/${repositoryName}`
    : "";

const nextConfig: NextConfig = {
  output: isGithubActions ? "export" : undefined,
  basePath,
  assetPrefix: basePath || undefined,
  trailingSlash: isGithubActions,
};

export default nextConfig;
