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
  known_latest_version?: string
  can_check_new_version_from?: string
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
      const message = `* New version of "${dCli()}" is available: ` +
        `"${std.semvar.format(latestVersion)}" *`
      console.error('*'.repeat(message.length))
      console.error(message)
      console.error('*'.repeat(message.length))
      console.error('')

      // Sets `can_announce_new_version_release_from` to one day later.
      versionCheckRecord.can_announce_release_from = oneDayLater
        .toISOString()
      updated = true
    }
  }

  // const latestResponse = await fetch(
  //   'https://api.github.com/repos/fenv-org/d/releases/latest',
  // )

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
  return std.path.join(dHomeDir(), 'version_check_record.json')
}

async function readVersionCheckRecord(): Promise<VersionCheckRecord> {
  const filepath = versionCheckRecordFilepath()
  await std.fs.ensureFile(filepath)
  return JSON.parse(await Deno.readTextFile(filepath))
}

if (import.meta.main) {
  await checkNewerVersionSilently()
  await main()
}
