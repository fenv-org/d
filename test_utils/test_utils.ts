import { std_fs, std_path, std_yaml } from '../lib/deps.ts'

export async function writeTextFile(path: string, text: string): Promise<void> {
  await std_fs.ensureDir(std_path.dirname(path))
  await Deno.writeTextFile(path, text)
}

export function touch(path: string): Promise<void> {
  return writeTextFile(path, '')
}

export function writeYamlFile(
  path: string,
  data: Record<string, unknown>,
): Promise<void> {
  return writeTextFile(path, std_yaml.stringify(data))
}

export function removeIndent(s: string): string {
  const lines = s.split('\n')
  const firstLine = lines.find((line) => line.trim().length > 0) ?? ''
  const indent = firstLine.match(/^\s+/)
  if (indent) {
    return lines.map((line) => line.replace(indent[0], '')).join('\n')
  }
  return s
}
