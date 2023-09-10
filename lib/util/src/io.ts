import { supportColorCheck } from '../../deps.ts'

export const LINE_FEED = Deno.build.os === 'windows' ? '\r\n' : '\n'

export type Stdout =
  & Deno.Writer
  & Deno.WriterSync
  & { rid?: number }

export type Stderr = Stdout

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
