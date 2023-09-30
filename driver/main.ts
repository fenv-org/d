import { std } from 'deps.ts'
import { supportColorCheck } from 'https://raw.githubusercontent.com/frunkad/supports-color/24c4e4afbdccc88011d6b33d06f0056a0d889f86/mod.ts'
import { dMain } from '../lib/d.ts'

const DEBUG_FLAG = '--debug'

async function main() {
  const debug = Deno.args.includes(DEBUG_FLAG)
  await run({ dMain }, { args: Deno.args, debug })
}

type Stdout = Deno.Writer & Deno.WriterSync & Deno.Closer & { rid: number }
type Stderr = Stdout

type MainFunction = (
  args: string[],
  options: {
    readonly cwd: string
    readonly stdout: Stdout
    readonly stderr: Stderr
    readonly colorSupported: boolean
  },
) => void | Promise<void>

type Entry = {
  dMain: MainFunction
}

async function run(
  entry: Entry,
  options: {
    args: string[]
    debug: boolean
  },
) {
  try {
    const voidOrPromise = entry.dMain(options.args, {
      cwd: Deno.cwd(),
      stdout: Deno.stdout,
      stderr: Deno.stderr,
      colorSupported: supportColorCheck().stdout ? true : false,
    })
    if (voidOrPromise instanceof Promise) {
      await voidOrPromise
    }
  } catch (error) {
    if (options.debug) {
      throw error
    }

    const colors = std.fmt.colors
    console.error(colors.brightRed(colors.bold('ERROR:')), error.message)
  }
}

main()
