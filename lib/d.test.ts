import { std } from 'deps.ts'
import { assertEquals } from 'test/deps.ts'

Deno.test('Test the behavior of `path.dirname()`', () => {
  assertEquals(std.path.dirname('/foo/bar/baz'), '/foo/bar')
  assertEquals(std.path.dirname('/foo/bar'), '/foo')
  assertEquals(std.path.dirname('/foo'), '/')
  assertEquals(std.path.dirname('/'), '/')
})
