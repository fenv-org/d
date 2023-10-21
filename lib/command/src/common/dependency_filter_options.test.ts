import { assertEquals } from 'test/deps.ts'
import { stripDependencyFilterOptions } from './dependency_filter_options.ts'

Deno.test('stripDependencyFilterOptions', async (t) => {
  await t.step('test case1', () => {
    assertEquals(
      stripDependencyFilterOptions(
        [
          '--config',
          'test-sample/d.yaml',
          '-v',
          'test',
          '--exclude-dependency',
          'abc',
          '--include-direct-dependency',
          'def',
          '--early-exit',
          '--include-dependency',
          'abc',
          '-r',
          'expanded',
          '--exclude-direct-dependency',
          'def',
          '--debug',
          '--include-dev-dependency',
          'ghi',
          '--exclude-dev-dependency',
          'jkl',
        ],
      ),
      [
        '--config',
        'test-sample/d.yaml',
        '-v',
        'test',
        '--early-exit',
        '-r',
        'expanded',
        '--debug',
      ],
    )
  })

  await t.step('test case2', () => {
    assertEquals(
      stripDependencyFilterOptions(
        [
          '--config=test-sample/d.yaml',
          '-v',
          'test',
          '--exclude-dependency=abc',
          '--include-direct-dependency=def',
          '--early-exit',
          '--include-dependency=abc',
          '--exclude-direct-dependency=def',
          '--debug',
          '--include-dev-dependency=ghi',
          '--exclude-dev-dependency=jkl',
        ],
      ),
      [
        '--config=test-sample/d.yaml',
        '-v',
        'test',
        '--early-exit',
        '--debug',
      ],
    )
  })
})
