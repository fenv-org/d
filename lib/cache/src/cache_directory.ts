import { std } from 'deps.ts'

const RELATIVE_CACHE_DIRECTORY = '.d'

export function getCacheDirectory(workspaceDir: string): string {
  return std.path.resolve(workspaceDir, RELATIVE_CACHE_DIRECTORY)
}

export function getCacheFilepath(workspaceDir: string): string {
  return std.path.join(getCacheDirectory(workspaceDir), 'bootstrap.yaml')
}
