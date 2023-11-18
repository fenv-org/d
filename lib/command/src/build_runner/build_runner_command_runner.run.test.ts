import { std } from 'deps.ts'
import {
  assertEquals,
  extractPackageNamesInOrder,
  runDMain,
  testBootstrap,
} from 'test/deps.ts'

Deno.test('Run `d br run`', async (t) => {
  // setup: bootstrap
  const testSampleDir = await testBootstrap()

  await t.step('execution', async () => {
    const { stdout } = await runDMain(
      testSampleDir,
      'br',
      'r',
      '--delete-conflicting-outputs',
      std.path.join('$WORKSPACE_PATH', 'sample_script.dart'),
      '--',
      '$PACKAGE_NAME',
      std.path.join('$PACKAGE_PATH', 'sample_output.txt'),
    )
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
