import {
  assertEquals,
  extractPackageNamesInOrder,
  runDMain,
  testBootstrap,
} from 'test/deps.ts'

Deno.test('d test: successful execution', async (t) => {
  // setup: bootstrap
  const testSampleDir = await testBootstrap()

  await t.step('execution', async () => {
    const { stdout } = await runDMain(
      testSampleDir,
      'test',
      '--no-early-exit',
      '--reporter',
      'expanded',
    )
    assertEquals(
      extractPackageNamesInOrder(stdout),
      [
        'fpm_sample_package_a',
        'fpm_sample_package_e',
        'fpm_sample_package_b',
        'fpm_sample_package_c',
        'fpm_sample_package_d',
        'fpm_sample_app',
      ],
    )
  })

  // teardown
  await Deno.remove(testSampleDir, { recursive: true })
})
