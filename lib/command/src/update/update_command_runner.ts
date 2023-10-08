import { Context } from 'context/mod.ts'
import { std } from 'deps.ts'
import { Logger, logLabels } from 'logger/mod.ts'
import { VERSION_STRING } from 'version/mod.ts'
import { UpdateOptions } from './update_command.ts'

export async function runUpdateCommand(
  context: Context,
  { args, options }: {
    args: string[]
    options: UpdateOptions
  },
): Promise<void> {
  const { logger } = context

  if (options.showList) {
    await showVersionList(logger)
  } else if (args.length === 0) {
    await installLatestVersion(logger)
  } else {
    await installSpecificVersion(logger, args[0])
  }
}

async function showVersionList(logger: Logger): Promise<void> {
  logger.stdout({ timestamp: true })
    .command('d update --show-list')
    .lineFeed()

  const list = await retrieveVersionList()
  let foundLatest = false
  for (const entry of list) {
    const currentVersion = `v${VERSION_STRING}` === entry.tag_name
    const prefix = currentVersion ? '* ' : '  '
    if (!foundLatest && !entry.prerelease) {
      foundLatest = true
      logger.stdout({ timestamp: true })
        .indent()
        .push((s) => s.bold(prefix + entry.tag_name.padEnd(12) + ' [latest]'))
        .lineFeed()
    } else {
      logger.stdout({ timestamp: true })
        .indent()
        .push(prefix + entry.tag_name)
        .lineFeed()
    }
  }
}

async function installLatestVersion(logger: Logger): Promise<void> {
  logger.stdout({ timestamp: true })
    .command('d update')
    .lineFeed()

  await runInstaller(logger)
}

async function installSpecificVersion(
  logger: Logger,
  version: string,
): Promise<void> {
  logger.stdout({ timestamp: true })
    .command(`d update ${version}`)
    .lineFeed()

  await runInstaller(logger, { version })
}

const INSTALLER_ENDPOINT = 'https://d-install.jerry.company'

async function runInstaller(
  logger: Logger,
  { version }: {
    version?: string
  } = {},
): Promise<void> {
  logger.stderr({ timestamp: true })
    .indent()
    .push('Downloading installer...')
    .lineFeed()
  const installerPath = await Deno.makeTempFile({ suffix: '.sh' })
  try {
    const response = await fetch(INSTALLER_ENDPOINT)
    await Deno.writeFile(installerPath, (await response.blob()).stream())

    logger.stderr({ timestamp: true })
      .indent()
      .push(`Installing ${version || 'the latest'} version...`)
      .lineFeed()
    const args = [
      installerPath,
      ...(version ? [version] : []),
    ]
    const env = {
      ...(dHome() !== defaultDHome() ? { D_INSTALL_DIR: dHome() } : {}),
    }
    const command = new Deno.Command('bash', {
      args,
      env,
      stdout: 'piped',
      stderr: 'piped',
    })
    const process = command.spawn()
    const output = await process.output()
    if (!output.success) {
      logger.stderr({ timestamp: true })
        .label(logLabels.error)
        .push((s) => s.bold.gray(`: Ends with code ${output.code}`))
        .lineFeed()
    } else {
      logger.stdout({ timestamp: true })
        .indent()
        .push((s) =>
          s.bold.cyan(
            `Installed ${version || 'the latest'} version successfully`,
          )
        )
        .lineFeed()
    }
  } finally {
    await Deno.remove(installerPath)
  }
}

function defaultDHome(): string {
  return std.path.resolve(Deno.env.get('HOME')!, '.d')
}

function dHome(): string {
  const _dHome = Deno.env.get('D_HOME')
  return _dHome ? std.path.resolve(_dHome) : defaultDHome()
}

interface ReleaseSummary {
  tag_name: string
  draft: boolean
  prerelease: boolean
}

const LIST_RELEASES_ENDPOINT =
  'https://api.github.com/repos/fenv-org/d/releases'

async function retrieveVersionList(): Promise<ReleaseSummary[]> {
  const response = await fetch(LIST_RELEASES_ENDPOINT)
  const summaries = (await response.json()) as ReleaseSummary[]
  return summaries
    .filter((entry: ReleaseSummary) => !entry.draft)
    .map((entry: ReleaseSummary) => ({
      tag_name: entry.tag_name,
      draft: entry.draft,
      prerelease: entry.prerelease,
    }))
}
