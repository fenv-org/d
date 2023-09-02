#!/usr/bin/env bash

# This is a script that runs `lib/fpm.ts` on the `test-sample/app` directory.

set -euox pipefail

deno run \
  --allow-read \
  --allow-write \
  --allow-env \
  --allow-net \
  --allow-run \
  lib/fpm.ts \
  --pwd test-sample/app \
  $@
