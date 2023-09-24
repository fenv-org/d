#!/usr/bin/env bash

# This is a script that compiles `driver/main.ts`

set -euox pipefail

deno compile \
  --allow-read \
  --allow-write \
  --allow-env \
  --allow-net \
  --allow-run \
  --no-prompt \
  --output build/d \
  driver/main.ts
