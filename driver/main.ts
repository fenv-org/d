import { std } from 'deps.ts'
import { supportColorCheck } from 'https://raw.githubusercontent.com/frunkad/supports-color/24c4e4afbdccc88011d6b33d06f0056a0d889f86/mod.ts'
import { version } from 'version/mod.ts'
import { dMain } from '../lib/d.ts'

const DEBUG_FLAG = '--debug'

async function main() {
  const debug = Deno.args.includes(DEBUG_FLAG)
  await run({ dMain }, { args: Deno.args, debug })
}

type Stdout = Deno.Writer & Deno.WriterSync & Deno.Closer & { rid: number }
type Stderr = Stdout

type MainFunction = (
  args: string[],
  options: {
    readonly cwd: string
    readonly stdout: Stdout
    readonly stderr: Stderr
    readonly colorSupported: boolean
  },
) => void | Promise<void>

type Entry = {
  dMain: MainFunction
}

async function run(
  entry: Entry,
  options: {
    args: string[]
    debug: boolean
  },
) {
  try {
    const voidOrPromise = entry.dMain(options.args, {
      cwd: Deno.cwd(),
      stdout: Deno.stdout,
      stderr: Deno.stderr,
      colorSupported: supportColorCheck().stdout ? true : false,
    })
    if (voidOrPromise instanceof Promise) {
      await voidOrPromise
    }
  } catch (error) {
    if (options.debug) {
      throw error
    }

    const colors = std.fmt.colors
    console.error(colors.brightRed(colors.bold('ERROR:')), error.message)
  }
}

type VersionCheckRecord = {
  /**
   * The latest version of d without leading `v` prefix.
   */
  known_latest_version?: string
  /**
   * The ISO date string that represents when can check the new release of
   * `d` with Github release API.
   */
  can_check_release_from?: string
  /**
   * The ISO date string that represents when can announce the new release of
   * `d`.
   */
  can_announce_release_from?: string
}

async function checkNewerVersionSilently() {
  try {
    await checkNewerVersion()
  } catch (_) {
    // ignore error because this process must be silent.
  }
}

async function checkNewerVersion() {
  const now = new Date()
  const oneDayLater = new Date(now.getTime() + 24 * 60 * 60 * 1000)

  function canAnnounceRelease(record: VersionCheckRecord) {
    if (!record.can_announce_release_from) {
      return true
    }

    const canAnnounceFrom = new Date(
      record.can_announce_release_from,
    )
    return now >= canAnnounceFrom
  }

  function canCheckRelease(record: VersionCheckRecord) {
    if (!record.can_check_release_from) {
      return true
    }

    const canCheckFrom = new Date(record.can_check_release_from)
    return now >= canCheckFrom
  }

  function newerLatestVersion(
    record: VersionCheckRecord,
  ): std.semvar.SemVer | undefined {
    if (!record.known_latest_version) {
      return undefined
    }

    const latestVersion = std.semvar.parse(record.known_latest_version)
    const currentVersion = version

    if (std.semvar.compare(currentVersion, latestVersion) < 0) {
      return latestVersion
    } else {
      return undefined
    }
  }

  const versionCheckRecord = await readVersionCheckRecord()
  let updated = false
  if (canAnnounceRelease(versionCheckRecord)) {
    const latestVersion = newerLatestVersion(versionCheckRecord)
    if (latestVersion) {
      const messages = [
        `New version of "${dCli()}" is available: ` +
        `"${std.semvar.format(latestVersion)}"`,
        `To install the latest version,`,
        `run \`${dCli()} update\``,
      ]
      const maxLineLength = messages.reduce(
        (max, line) => Math.max(max, line.length),
        0,
      )
      console.error('*'.repeat(maxLineLength + 4))
      for (const message of messages) {
        console.error('* ' + message.padEnd(maxLineLength) + ' *')
      }
      console.error('*'.repeat(maxLineLength + 4))
      console.error('')

      // Sets `can_announce_new_version_release_from` to one day later.
      versionCheckRecord.can_announce_release_from = oneDayLater
        .toISOString()
      updated = true
    }
  }

  if (canCheckRelease(versionCheckRecord)) {
    const response = await fetch(
      'https://api.github.com/repos/fenv-org/d/releases/latest',
    )
    if (response.ok) {
      let latestVersion = (await response.json()).tag_name as string
      latestVersion = latestVersion.replace(/^v/, '')
      if (latestVersion) {
        // Sets `known_latest_version` to the latest version.
        versionCheckRecord.known_latest_version = latestVersion
        // Sets `can_check_release_from` to one day later.
        versionCheckRecord.can_check_release_from = oneDayLater
          .toISOString()
        updated = true
      }
    }
  }

  if (updated) {
    await Deno.writeTextFile(
      versionCheckRecordFilepath(),
      JSON.stringify(versionCheckRecord, null, 2),
    )
  }
}

function dHomeDir(): string {
  return Deno.env.get('D_HOME') ??
    std.path.resolve(Deno.env.get('HOME')!, '.d')
}

function dCli(): string {
  return Deno.env.get('D_CLI') ?? 'd'
}

function versionCheckRecordFilepath(): string {
  return std.path.join(dHomeDir(), 'version.json')
}

async function readVersionCheckRecord(): Promise<VersionCheckRecord> {
  const filepath = versionCheckRecordFilepath()
  await std.fs.ensureFile(filepath)
  try {
    return JSON.parse(await Deno.readTextFile(filepath))
  } catch (_) {
    return {}
  }
}

if (import.meta.main) {
  await checkNewerVersionSilently()
  await main()
}
