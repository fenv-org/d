import { run } from './run.ts'

const DEBUG_FLAG = '--debug'

async function main() {
  const debug = Deno.args.includes(DEBUG_FLAG)
  if (debug) {
    console.error(`Running in "develop" mode`)
  }

  const libPath: string = getLibPath()
  await run({ libPath, args: Deno.args, debug })
}

function getLibPath(): string {
  return '../lib/d.ts'
}

main()
