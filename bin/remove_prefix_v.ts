function main() {
  let version = Deno.args[0]
  // remove the prefix `v` from the version string
  if (version.startsWith('v')) {
    version = version.slice(1)
  }

  const lineFeed = Deno.build.os === 'windows' ? '\r\n' : '\n'
  const outputFilename = Deno.env.get('GITHUB_OUTPUT')!
  Deno.writeTextFileSync(
    outputFilename,
    `semvar=${version}${lineFeed}`,
    {
      append: true,
    },
  )
}

main()
