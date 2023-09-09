import { colors } from 'https://deno.land/x/cliffy@v1.0.0-rc.3/ansi/colors.ts'

type dMain = {
  dMain: (
    args: string[],
    options: {
      readonly cwd: string
      readonly stdout: Deno.Writer & Deno.WriterSync
      readonly stderr: Deno.Writer & Deno.WriterSync
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
