import { supportColorCheck } from '../../deps.ts'

/**
 * The line feed sequence of the current operating system.
 */
export const LINE_FEED = Deno.build.os === 'windows' ? '\r\n' : '\n'

/**
 * The standard input stream.
 */
export type Stdout =
  & Deno.Writer
  & Deno.WriterSync
  & { rid?: number }

/**
 * The standard error stream.
 */
export type Stderr = Stdout

/**
 * Returns `true` if the given stream supports ansi color.
 */
export function supportsColor(stream: Deno.Writer & { rid?: number }): boolean {
  if ('rid' in stream && stream.rid !== undefined) {
    const checkResult = supportColorCheck().supportsColor({
      ...stream,
      close: () => {},
      rid: stream.rid,
    })
    return checkResult && checkResult.hasBasic
  } else {
    return false
  }
}
