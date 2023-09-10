import { std } from '../lib/deps.ts'
import { assertEquals } from './test_deps.ts'

Deno.test('Test the behavior of `path.dirname()`', () => {
  assertEquals(std.path.dirname('/foo/bar/baz'), '/foo/bar')
  assertEquals(std.path.dirname('/foo/bar'), '/foo')
  assertEquals(std.path.dirname('/foo'), '/')
  assertEquals(std.path.dirname('/'), '/')
})
