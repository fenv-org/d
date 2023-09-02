import { colors } from 'https://deno.land/x/cliffy@v1.0.0-rc.3/ansi/colors.ts'

type FPM = {
  fpm: (args: string[]) => void | Promise<void>
}

export async function run(
  options: {
    libPath: string
    args: string[]
    debug: boolean
  },
) {
  try {
    const { fpm }: FPM = await import(options.libPath)
    const voidOrPromise = fpm(options.args)
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
