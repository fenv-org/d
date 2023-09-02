type FPM = {
  fpm: (args: string[]) => void | Promise<void>
}

const RELEASE_FLAG = '--release'
const DEBUG_FLAG = '--debug'

async function main() {
  const debug = Deno.args.includes(DEBUG_FLAG)
  const releaseMode = Deno.args.includes(RELEASE_FLAG)
  if (debug) {
    console.error('Running in release mode')
  } else {
    console.error('Running in develop mode')
  }

  const libPath: string = getLibPath(releaseMode)
  const args: string[] = Deno.args.filter((arg) => arg !== RELEASE_FLAG)
  const { fpm }: FPM = await import(libPath)
  const voidOrPromise = fpm(args)
  if (voidOrPromise instanceof Promise) {
    await voidOrPromise
  }
}

function getLibPath(releaseMode: boolean): string {
  if (releaseMode) {
    return 'https://raw.githubusercontent.com/fenv-org/fpm/main/lib/fpm.ts'
  } else {
    return '../lib/fpm.ts'
  }
}

main()
