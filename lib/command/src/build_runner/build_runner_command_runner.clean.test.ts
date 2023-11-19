import {
  assertEquals,
  extractPackageNamesInOrder,
  runDMain,
  testBootstrap,
} from 'test/deps.ts'

Deno.test('Run `d br clean`', async (t) => {
  // setup: bootstrap
  const testSampleDir = await testBootstrap()

  await t.step('Run `d br clean`', async () => {
    const { stdout } = await runDMain(testSampleDir, 'br', 'c')
    assertEquals(
      extractPackageNamesInOrder(stdout),
      ['fpm_sample_package_c', 'fpm_sample_app'],
    )
  })

  // teardown
  await Deno.remove(testSampleDir, { recursive: true })
})
