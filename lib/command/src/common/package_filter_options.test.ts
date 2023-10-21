import { assertEquals } from 'test/deps.ts'
import { stripPackageFilterOptions } from './package_filter_options.ts'

Deno.test('stripPackageFilterOptions', async (t) => {
  await t.step('test case1', () => {
    assertEquals(
      stripPackageFilterOptions([
        '--config',
        'test-sample/d.yaml',
        '-v',
        'test',
        '--include-has-file',
        'abc',
        '--exclude-has-file',
        'def',
        '--early-exit',
        '--include-has-dir',
        'abc',
        '-r',
        'expanded',
        '--exclude-has-dir',
        'def',
        '--debug',
      ]),
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
      stripPackageFilterOptions([
        '--config=test-sample/d.yaml',
        '-v',
        'test',
        '--include-has-file=abc',
        '--exclude-has-file=def',
        '--early-exit',
        '--include-has-dir=abc',
        '--exclude-has-dir=def',
        '--debug',
      ]),
      [
        '--config=test-sample/d.yaml',
        '-v',
        'test',
        '--early-exit',
        '--debug',
      ],
    )
  })

  await t.step('test case3', () => {
    assertEquals(
      stripPackageFilterOptions([
        '--config',
        'test-sample/d.yaml',
        '-v',
        'test',
        '--if',
        'abc',
        '--ef',
        'def',
        '--early-exit',
        '--id',
        'abc',
        '-r',
        'expanded',
        '--ed',
        'def',
        '--debug',
      ]),
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

  await t.step('test case4', () => {
    assertEquals(
      stripPackageFilterOptions([
        '--config=test-sample/d.yaml',
        '-v',
        'test',
        '--if=abc',
        '--ef=def',
        '--early-exit',
        '--id=abc',
        '--ed=def',
        '--debug',
      ]),
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
