import {
  assertFileContains,
  assertFileNotExists,
  copyTestSample,
  std,
} from 'test/deps.ts'
import { dMain } from '../../../d.ts'

Deno.test('Run `d run`: success', async (t) => {
  // setup: bootstrap
  const testSampleDir = await copyTestSample()

  await dMain(['bootstrap'], {
    cwd: testSampleDir,
    stdout: Deno.stdout,
    stderr: Deno.stderr,
    colorSupported: true,
  })

  await t.step('execution', async () => {
    await dMain([
      'run',
      '--include-dev-dependency',
      'build_runner',
      '--',
      '( echo "PWD=$PWD" && ' +
      'echo "WORKSPACE_PATH=$WORKSPACE_PATH" && ' +
      'echo "PACKAGE_NAME=$PACKAGE_NAME" && ' +
      'echo "PACKAGE_PATH=$PACKAGE_PATH" && ' +
      'pwd ) > sample_output.txt',
    ], {
      cwd: testSampleDir,
      stdout: Deno.stdout,
      stderr: Deno.stderr,
      colorSupported: true,
    })

    // verification
    assertFileContains(
      std.path.resolve(testSampleDir, 'app/sample_output.txt'),
      [
        `PWD=${testSampleDir}/app`,
        `WORKSPACE_PATH=${testSampleDir}`,
        'PACKAGE_NAME=fpm_sample_app',
        `PACKAGE_PATH=${testSampleDir}/app`,
        `${testSampleDir}/app`,
        '',
      ].join('\n'),
    )
    assertFileNotExists(testSampleDir, 'app/packages/pack-e/sample_output.txt')
    assertFileNotExists(testSampleDir, 'packages/pack-a/sample_output.txt')
    assertFileNotExists(testSampleDir, 'packages/pack-b/sample_output.txt')
    assertFileContains(
      std.path.resolve(testSampleDir, 'packages/pack-c/sample_output.txt'),
      [
        `PWD=${testSampleDir}/packages/pack-c`,
        `WORKSPACE_PATH=${testSampleDir}`,
        'PACKAGE_NAME=fpm_sample_package_c',
        `PACKAGE_PATH=${testSampleDir}/packages/pack-c`,
        `${testSampleDir}/packages/pack-c`,
        '',
      ].join('\n'),
    )
    assertFileNotExists(testSampleDir, 'packages/pack-d/sample_output.txt')
  })

  // teardown
  await Deno.remove(testSampleDir, { recursive: true })
})
