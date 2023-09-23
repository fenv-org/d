import { std, supportColorCheck } from '../../deps.ts'

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

/**
 * A helper class that provides many helper functions to manipulate the
 * byte array stream.
 */
export class ByteStreams {
  /**
   * Reads the given stream as a string line by line.
   */
  static async *readLines(
    stream: ReadableStream<Uint8Array>,
  ): AsyncIterable<string> {
    for await (
      const line of stream
        .pipeThrough(new TextDecoderStream())
        .pipeThrough(new std.streams.TextLineStream())
    ) {
      yield line
    }
  }
}
