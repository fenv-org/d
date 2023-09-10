import { colors } from 'https://deno.land/x/cliffy@v1.0.0-rc.3/ansi/colors.ts'
import { supportColorCheck } from 'https://raw.githubusercontent.com/frunkad/supports-color/24c4e4afbdccc88011d6b33d06f0056a0d889f86/mod.ts'

type Stdout = Deno.Writer & Deno.WriterSync & Deno.Closer & { rid: number }
type Stderr = Stdout

type dMain = {
  dMain: (
    args: string[],
    options: {
      readonly cwd: string
      readonly stdout: Stdout
      readonly stderr: Stderr
      readonly colorSupported: boolean
    },
  ) => void | Promise<void>
}

export async function run(
  options: {
    libPath: string
    args: string[]
    debug: boolean
  },
) {
  try {
    const { dMain }: dMain = await import(options.libPath)
    const voidOrPromise = dMain(options.args, {
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
    console.error(colors.brightRed(colors.bold('ERROR:')), error.message)
  }
}
