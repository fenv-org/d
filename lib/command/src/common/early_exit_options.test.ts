import { assertEquals } from 'test/deps.ts'
import { stripEarlyExitOptions } from './early_exit_options.ts'

Deno.test('stripEarlyExitOptions', async (t) => {
  await t.step('test case1', () => {
    assertEquals(
      stripEarlyExitOptions(
        '--config test-sample/d.yaml -v test --early-exit -r expanded abc --debug'
          .split(/\s+/),
      ),
      [
        '--config',
        'test-sample/d.yaml',
        '-v',
        'test',
        '-r',
        'expanded',
        'abc',
        '--debug',
      ],
    )
  })

  await t.step('test case2', () => {
    assertEquals(
      stripEarlyExitOptions(
        '--config=test-sample/d.yaml test --verbose --early-exit -r expanded abc'
          .split(/\s+/),
      ),
      [
        '--config=test-sample/d.yaml',
        'test',
        '--verbose',
        '-r',
        'expanded',
        'abc',
      ],
    )
  })
})
