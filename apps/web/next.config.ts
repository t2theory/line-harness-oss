import type { NextConfig } from 'next'
import { execSync } from 'child_process'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const pkg = JSON.parse(readFileSync(resolve(__dirname, '../../package.json'), 'utf-8'))
const repoRoot = resolve(__dirname, '../..')

function readGitSha(): string | null {
  try {
    return execSync('git rev-parse HEAD', { cwd: repoRoot, stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim()
  } catch {
    return null
  }
}

const buildSha =
  process.env.APP_COMMIT_SHA || process.env.GITHUB_SHA || process.env.CF_PAGES_COMMIT_SHA || readGitSha() || 'local'
const buildTime = process.env.APP_BUILD_TIME || new Date().toISOString()

const nextConfig: NextConfig = {
  output: 'export',
  typescript: {
    ignoreBuildErrors: true,
  },
  transpilePackages: ['@line-crm/shared', '@line-harness/update-engine'],
  env: {
    APP_VERSION: pkg.version,
    APP_COMMIT_SHA: buildSha.slice(0, 12),
    APP_BUILD_TIME: buildTime,
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  webpack(config: any) {
    config.resolve = config.resolve ?? {}
    config.resolve.alias = {
      ...(config.resolve.alias as Record<string, string>),
      '@line-crm/shared': resolve(__dirname, '../../packages/shared/src/index.ts'),
      '@line-harness/update-engine/pure': resolve(__dirname, '../../packages/update-engine/dist/pure.mjs'),
    }
    return config
  },
}
export default nextConfig
