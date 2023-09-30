import { Buffer, std } from 'test_deps.ts'
import { LINE_FEED } from '../lib/util/mod.ts'

export async function writeTextFile(path: string, text: string): Promise<void> {
  await std.fs.ensureDir(std.path.dirname(path))
  await Deno.writeTextFile(path, text)
}

export function touch(path: string): Promise<void> {
  return writeTextFile(path, '')
}

export function writeYamlFile(
  path: string,
  data: Record<string, unknown>,
): Promise<void> {
  return writeTextFile(path, std.yaml.stringify(data))
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

export function buildStringFromBuffer(buffer: Buffer): string {
  const decoder = new TextDecoder()
  return decoder.decode(buffer.bytes())
}

export function buildStringLinesFromBuffer(buffer: Buffer): string[] {
  return buildStringFromBuffer(buffer).split(LINE_FEED)
}

export function buildAbsPath(...paths: string[]): string {
  return std.path.join(Deno.cwd(), ...paths)
}
