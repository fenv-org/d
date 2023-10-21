import { assertEquals } from 'test/deps.ts'
import { stripGlobalOptions } from './options.ts'

Deno.test('stripGlobalOptions', async (t) => {
  await t.step('test case1', () => {
    assertEquals(
      stripGlobalOptions(
        '--config test-sample/d.yaml -v test --early-exit -r expanded abc --debug'
          .split(/\s+/),
      ),
      ['test', '--early-exit', '-r', 'expanded', 'abc'],
    )
  })

  await t.step('test case2', () => {
    assertEquals(
      stripGlobalOptions(
        '--config=test-sample/d.yaml test --verbose --early-exit -r expanded abc'
          .split(/\s+/),
      ),
      ['test', '--early-exit', '-r', 'expanded', 'abc'],
    )
  })
})
