import {
  assertEquals,
  assertFileExists,
  assertFileNotExists,
  extractPackageNamesInOrder,
  runDMain,
  testBootstrap,
} from 'test/deps.ts'

Deno.test('Run `d br build`', async (t) => {
  // setup: bootstrap
  const testSampleDir = await testBootstrap()

  await t.step('pre-condition', () => {
    assertFileNotExists(testSampleDir, 'app/lib/sample.freezed.dart')
    assertFileNotExists(testSampleDir, 'packages/pack-c/lib/sample.g.dart')
  })

  await t.step('execution', async () => {
    const { stdout } = await runDMain(testSampleDir, 'br', 'b', '-d')

    assertFileExists(testSampleDir, 'app/lib/sample.freezed.dart')
    assertFileExists(testSampleDir, 'packages/pack-c/lib/sample.g.dart')
    assertEquals(
      extractPackageNamesInOrder(stdout),
      ['fpm_sample_package_c', 'fpm_sample_app'],
    )
  })

  // teardown
  await Deno.remove(testSampleDir, { recursive: true })
})
