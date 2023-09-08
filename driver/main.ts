import { run } from './run.ts'

const DEBUG_FLAG = '--debug'

async function main() {
  const debug = Deno.args.includes(DEBUG_FLAG)
  if (debug) {
    console.error(`Running in "release" mode`)
  }

  const libPath: string = getLibPath()
  await run({ libPath, args: Deno.args, debug })
}

function getLibPath(): string {
  const version = 'main'
  return `https://raw.githubusercontent.com/fenv-org/d/${version}/lib/d.ts`
}

main()
