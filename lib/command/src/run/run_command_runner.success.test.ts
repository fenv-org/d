import {
  assertFileContains,
  assertFileNotExists,
  runDMain,
  std,
  testBootstrap,
} from 'test/deps.ts'

Deno.test('Run `d run`: success', async (t) => {
  // setup: bootstrap
  const testSampleDir = await testBootstrap()

  await t.step('execution', async () => {
    await runDMain(
      testSampleDir,
      'run',
      '--include-dev-dependency',
      'build_runner',
      '--',
      '( echo "PWD=$PWD" && ' +
        'echo "WORKSPACE_PATH=$WORKSPACE_PATH" && ' +
        'echo "PACKAGE_NAME=$PACKAGE_NAME" && ' +
        'echo "PACKAGE_PATH=$PACKAGE_PATH" && ' +
        'pwd ) > sample_output.txt',
    )

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
