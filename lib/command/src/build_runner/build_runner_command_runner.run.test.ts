import { std } from 'deps.ts'
import {
  assertEquals,
  Buffer,
  copyTestSample,
  extractPackageNamesInOrder,
} from 'test/deps.ts'
import { dMain } from '../../../d.ts'

Deno.test('Run `d br run`', async (t) => {
  // setup: bootstrap
  const testSampleDir = await copyTestSample()

  await dMain(['bootstrap'], {
    cwd: testSampleDir,
    stdout: Deno.stdout,
    stderr: Deno.stderr,
    colorSupported: true,
  })

  await t.step('execution', async () => {
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
      cwd: testSampleDir,
      stdout: stdout,
      stderr: stderr,
      colorSupported: false,
    })
    assertEquals(
      Deno.readTextFileSync(
        std.path.join(testSampleDir, 'app/sample_output.txt'),
      ),
      'fpm_sample_app\n',
    )
    assertEquals(
      Deno.readTextFileSync(
        std.path.join(testSampleDir, 'packages/pack-c/sample_output.txt'),
      ),
      'fpm_sample_package_c\n',
    )
    assertEquals(
      extractPackageNamesInOrder(stdout),
      ['fpm_sample_package_c', 'fpm_sample_app'],
    )
  })

  // teardown
  await Deno.remove(testSampleDir, { recursive: true })
})
