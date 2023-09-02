type FPM = {
  fpm: (args: string[]) => void | Promise<void>
}

enum ExecutionMode {
  develop = 'develop',
  release = 'release',
}

const DEVELOP_FLAG = '--develop'
const DEBUG_FLAG = '--debug'

async function main() {
  const debug = Deno.args.includes(DEBUG_FLAG)
  const executionMode = Deno.args.includes(DEVELOP_FLAG)
    ? ExecutionMode.develop
    : ExecutionMode.release
  if (debug) {
    console.error(`Running in "${executionMode}" mode`)
  }

  const libPath: string = getLibPath(executionMode)
  const args: string[] = Deno.args.filter((arg) => arg !== DEVELOP_FLAG)
  const { fpm }: FPM = await import(libPath)
  const voidOrPromise = fpm(args)
  if (voidOrPromise instanceof Promise) {
    await voidOrPromise
  }
}

function getLibPath(executionMode: ExecutionMode): string {
  switch (executionMode) {
    case ExecutionMode.develop:
      return '../lib/fpm.ts'
    case ExecutionMode.release:
      return getReleaseLibPath()
  }
}

function getReleaseLibPath(): string {
  const version = 'main'
  return `https://raw.githubusercontent.com/fenv-org/fpm/${version}/lib/fpm.ts`
}

main()
