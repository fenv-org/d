import { std } from 'deps.ts'
import {
  assertEquals,
  Buffer,
  buildStringLinesFromBuffer,
  copyTestSample,
} from 'test/deps.ts'
import { dMain } from '../../../d.ts'

Deno.test('d graph: call graphCommand()', async (t) => {
  // setup
  Deno.env.set('D_LOG_TIME', '0')
  const testSampleDir = await copyTestSample()

  await t.step('execution', async () => {
    const stdout = new Buffer()
    const stderr = new Buffer()
    await dMain(['graph'], {
      cwd: std.path.resolve(testSampleDir, 'packages/pack-a'),
      stdout,
      stderr,
      colorSupported: false,
    })

    const stdoutLines = buildStringLinesFromBuffer(stdout)
    const sep = std.path.SEP
    assertEquals(
      stdoutLines,
      [
        `Analyzed dependency graph: the base directory path is \`${testSampleDir}\``,
        `┌──────────────────────┬─────────────────────┬──────────────────────┬──────────────────────┐`,
        `│ name                 │ path                │ dependencies         │ dependents           │`,
        `├──────────────────────┼─────────────────────┼──────────────────────┼──────────────────────┤`,
        `│ fpm_sample_app       │ app                 │ fpm_sample_package_a │                      │`,
        `│                      │                     │ fpm_sample_package_b │                      │`,
        `│                      │                     │ fpm_sample_package_c │                      │`,
        `│                      │                     │ fpm_sample_package_d │                      │`,
        `│                      │                     │ fpm_sample_package_e │                      │`,
        `├──────────────────────┼─────────────────────┼──────────────────────┼──────────────────────┤`,
        `│ fpm_sample_package_a │ packages${sep}pack-a     │                      │ fpm_sample_app       │`,
        `│                      │                     │                      │ fpm_sample_package_b │`,
        `│                      │                     │                      │ fpm_sample_package_c │`,
        `├──────────────────────┼─────────────────────┼──────────────────────┼──────────────────────┤`,
        `│ fpm_sample_package_b │ packages${sep}pack-b     │ fpm_sample_package_a │ fpm_sample_app       │`,
        `│                      │                     │                      │ fpm_sample_package_d │`,
        `├──────────────────────┼─────────────────────┼──────────────────────┼──────────────────────┤`,
        `│ fpm_sample_package_c │ packages${sep}pack-c     │ fpm_sample_package_a │ fpm_sample_app       │`,
        `│                      │                     │                      │ fpm_sample_package_d │`,
        `├──────────────────────┼─────────────────────┼──────────────────────┼──────────────────────┤`,
        `│ fpm_sample_package_d │ packages${sep}pack-d     │ fpm_sample_package_b │ fpm_sample_app       │`,
        `│                      │                     │ fpm_sample_package_c │                      │`,
        `├──────────────────────┼─────────────────────┼──────────────────────┼──────────────────────┤`,
        `│ fpm_sample_package_e │ app${sep}packages${sep}pack-e │                      │ fpm_sample_app       │`,
        `└──────────────────────┴─────────────────────┴──────────────────────┴──────────────────────┘`,
        ``,
      ],
    )
    assertEquals(stderr.empty(), true)
  })

  // teardown
  Deno.env.delete('D_LOG_TIME')
  await Deno.remove(testSampleDir, { recursive: true })
})

Deno.test('d graph: call graphCommand() with `D_WORKSPACE`', async (t) => {
  Deno.env.set('D_LOG_TIME', '0')
  const testSampleDir = await copyTestSample()

  await t.step('execution', async () => {
    const stdout = new Buffer()
    const stderr = new Buffer()
    Deno.env.set('D_WORKSPACE', '../..')
    await dMain(['graph'], {
      cwd: std.path.resolve(testSampleDir, 'packages/pack-a'),
      stdout,
      stderr,
      colorSupported: false,
    })

    const stdoutLines = buildStringLinesFromBuffer(stdout)
    const sep = std.path.SEP
    assertEquals(
      stdoutLines,
      [
        `Analyzed dependency graph: the base directory path is \`${testSampleDir}\``,
        `┌──────────────────────┬─────────────────────┬──────────────────────┬──────────────────────┐`,
        `│ name                 │ path                │ dependencies         │ dependents           │`,
        `├──────────────────────┼─────────────────────┼──────────────────────┼──────────────────────┤`,
        `│ fpm_sample_app       │ app                 │ fpm_sample_package_a │                      │`,
        `│                      │                     │ fpm_sample_package_b │                      │`,
        `│                      │                     │ fpm_sample_package_c │                      │`,
        `│                      │                     │ fpm_sample_package_d │                      │`,
        `│                      │                     │ fpm_sample_package_e │                      │`,
        `├──────────────────────┼─────────────────────┼──────────────────────┼──────────────────────┤`,
        `│ fpm_sample_package_a │ packages${sep}pack-a     │                      │ fpm_sample_app       │`,
        `│                      │                     │                      │ fpm_sample_package_b │`,
        `│                      │                     │                      │ fpm_sample_package_c │`,
        `├──────────────────────┼─────────────────────┼──────────────────────┼──────────────────────┤`,
        `│ fpm_sample_package_b │ packages${sep}pack-b     │ fpm_sample_package_a │ fpm_sample_app       │`,
        `│                      │                     │                      │ fpm_sample_package_d │`,
        `├──────────────────────┼─────────────────────┼──────────────────────┼──────────────────────┤`,
        `│ fpm_sample_package_c │ packages${sep}pack-c     │ fpm_sample_package_a │ fpm_sample_app       │`,
        `│                      │                     │                      │ fpm_sample_package_d │`,
        `├──────────────────────┼─────────────────────┼──────────────────────┼──────────────────────┤`,
        `│ fpm_sample_package_d │ packages${sep}pack-d     │ fpm_sample_package_b │ fpm_sample_app       │`,
        `│                      │                     │ fpm_sample_package_c │                      │`,
        `├──────────────────────┼─────────────────────┼──────────────────────┼──────────────────────┤`,
        `│ fpm_sample_package_e │ app${sep}packages${sep}pack-e │                      │ fpm_sample_app       │`,
        `└──────────────────────┴─────────────────────┴──────────────────────┴──────────────────────┘`,
        ``,
      ],
    )
    assertEquals(stderr.empty(), true)
  })

  // tear down
  Deno.env.delete('D_WORKSPACE')
  Deno.env.delete('D_LOG_TIME')
  await Deno.remove(testSampleDir, { recursive: true })
})
