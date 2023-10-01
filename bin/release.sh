#!/usr/bin/env bash

# This is a helper script that:
# - Overwrites `VERSION_STRING` in `lib/version/src/version.ts` to the given
#   version name.
# - Makes a new commit with the version name as the commit message.
# - Tags the commit with the version name.
# - Pushes the commit and tag to the remote repository.

set -eox pipefail

if [ -z "$1" ]; then
  echo "Usage: $0 <version>"
  exit 1
fi

# If "$1" doesn't have a leading `v`, we should add it
if [[ ! "$1" =~ ^v ]]; then
  version="v$1"
else
  version="$1"
fi


# Update version string
echo "export const VERSION_STRING = '$version'" > lib/version/src/version.ts

# # Commit and tag
git add lib/version/src/version.ts
git commit -m "Bump up version: $version"
git tag "$version"

# Push
git push origin

# Push tags
git push --tags
