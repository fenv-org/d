import { std_path } from '../lib/deps.ts'
import * as fpm from '../lib/fpm.ts'
import { assertEquals } from './test_deps.ts'

Deno.test('Hello world', () => {
  fpm.fpm(['list', '--json', '--verbose'])
})

Deno.test('Test the behavior of `path.dirname()`', () => {
  assertEquals(std_path.dirname('/foo/bar/baz'), '/foo/bar')
  assertEquals(std_path.dirname('/foo/bar'), '/foo')
  assertEquals(std_path.dirname('/foo'), '/')
  assertEquals(std_path.dirname('/'), '/')
})
