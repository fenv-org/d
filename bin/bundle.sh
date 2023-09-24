#!/usr/bin/env bash

# This is a helper script to bundle a file using 'deno_emit' and output
# the result to stdout or a file

set -eox pipefail

dvm use 1>&2
echo "
import { bundle } from 'https://deno.land/x/emit/mod.ts'
import * as fs from 'https://deno.land/std/fs/mod.ts'
import * as path from 'https://deno.land/std/path/mod.ts'

const _path = '$1'.startsWith('http')
  ? '$1'
  : path.resolve('$1')
const { code, map } = await bundle(
  new URL(_path, import.meta.url)
)

if ('$2') {
  fs.ensureDirSync(path.dirname(path.resolve('$2')))
  Deno.writeTextFileSync('$2', \`// deno-fmt-ignore-file
// deno-lint-ignore-file
// This code was bundled using 'deno_emit' and 
// it's not recommended to edit it manually

\` + code)
} else {
  console.log(code)
}
" | \
deno run \
  --allow-read \
  --allow-write \
  --allow-net \
  --allow-env=DENO_DIR,HOME,DENO_AUTH_TOKENS \
  -
