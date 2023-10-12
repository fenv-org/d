import { std } from 'deps.ts'
import {
  assertEquals,
  assertFileExists,
  assertFileNotExists,
  Buffer,
  extractPackageNamesInOrder,
} from 'test/deps.ts'
import { dMain } from '../../../d.ts'

Deno.test('check if `d br build` generates files.', async (t) => {
  // setup: bootstrap
  await dMain(['bootstrap'], {
    cwd: 'test-sample',
    stdout: Deno.stdout,
    stderr: Deno.stderr,
    colorSupported: true,
  })
  // setup: clean any existing auto-gen files.
  for (const entry of std.fs.expandGlobSync('test-sample/**/*.freezed.dart')) {
    entry.isFile && Deno.removeSync(entry.path)
  }
  for (const entry of std.fs.expandGlobSync('test-sample/**/*.g.dart')) {
    entry.isFile && Deno.removeSync(entry.path)
  }
  for (
    const entry of std.fs.expandGlobSync('test-sample/**/sample_output.txt')
  ) {
    entry.isFile && Deno.removeSync(entry.path)
  }

  await t.step('Run `d br build`', async () => {
    const stdout = new Buffer()
    const stderr = new Buffer()
    assertFileNotExists(
      std.path.join('test-sample', 'app', 'lib', 'sample.freezed.dart'),
    )
    assertFileNotExists(
      std.path.join(
        'test-sample',
        'packages',
        'pack-c',
        'lib',
        'sample.g.dart',
      ),
    )
    await dMain(['br', 'b', '-d'], {
      cwd: 'test-sample',
      stdout: stdout,
      stderr: stderr,
      colorSupported: false,
    })
    assertFileExists(
      std.path.join('test-sample', 'app', 'lib', 'sample.freezed.dart'),
    )
    assertFileExists(
      std.path.join(
        'test-sample',
        'packages',
        'pack-c',
        'lib',
        'sample.g.dart',
      ),
    )
    assertEquals(
      extractPackageNamesInOrder(stdout),
      ['fpm_sample_package_c', 'fpm_sample_app'],
    )
  })

  await t.step('Run `d br clean`', async () => {
    const stdout = new Buffer()
    const stderr = new Buffer()
    await dMain(['br', 'c'], {
      cwd: 'test-sample',
      stdout: stdout,
      stderr: stderr,
      colorSupported: false,
    })
    assertEquals(
      extractPackageNamesInOrder(stdout),
      ['fpm_sample_package_c', 'fpm_sample_app'],
    )
  })

  await t.step('Run `d br run`', async () => {
    const stdout = new Buffer()
    const stderr = new Buffer()
    await dMain([
      'br',
      'r',
      '--delete-conflicting-outputs',
      std.path.join('$WORKSPACE_PATH', 'sample_script.dart'),
      '--',
      '$PACKAGE_NAME',
      std.path.join('$PACKAGE_PATH', 'sample_output.txt'),
    ], {
      cwd: 'test-sample',
      stdout: stdout,
      stderr: stderr,
      colorSupported: false,
    })
    assertEquals(
      Deno.readTextFileSync(
        std.path.join('test-sample', 'app', 'sample_output.txt'),
      ),
      'fpm_sample_app\n',
    )
    assertEquals(
      Deno.readTextFileSync(
        std.path.join('test-sample', 'packages', 'pack-c', 'sample_output.txt'),
      ),
      'fpm_sample_package_c\n',
    )
    assertEquals(
      extractPackageNamesInOrder(stdout),
      ['fpm_sample_package_c', 'fpm_sample_app'],
    )
  })

  // clean up
  for (const entry of std.fs.expandGlobSync('test-sample/**/*.freezed.dart')) {
    entry.isFile && Deno.removeSync(entry.path)
  }
  for (const entry of std.fs.expandGlobSync('test-sample/**/*.g.dart')) {
    entry.isFile && Deno.removeSync(entry.path)
  }
  for (
    const entry of std.fs.expandGlobSync('test-sample/**/sample_output.txt')
  ) {
    entry.isFile && Deno.removeSync(entry.path)
  }
})
