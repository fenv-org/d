import { std } from '../../deps.ts'
import { assertEquals } from '../../test_deps.ts'
import { Chain } from './chain.ts'

Deno.test('Chain.of', () => {
  assertEquals(Chain.of(1).value, 1)
  assertEquals(Chain.of(null).value, null)
  assertEquals(Chain.of(undefined).value, undefined)
})

Deno.test('Chain.ofNullable', () => {
  assertEquals(Chain.ofNullable(1).value, 1)
  assertEquals(Chain.ofNullable<number>(null).value, undefined)
  assertEquals(Chain.ofNullable<number>(undefined).value, undefined)
})

Deno.test('Chain.with', () => {
  assertEquals(Chain.with(() => 1).value, 1)
  assertEquals(Chain.with(() => null).value, null)
  assertEquals(Chain.with(() => undefined).value, undefined)
})

Deno.test('Chain.empty', () => {
  assertEquals(Chain.empty<number>().value, undefined)
})

Deno.test('Chain.tap', () => {
  let value: number | undefined = undefined
  Chain.of(1).tap((it) => (value = it))
  assertEquals(value, 1)
})

Deno.test('Chain.map', () => {
  assertEquals(Chain.of(1).map((it) => it + 1).value, 2)
})

Deno.test('Chain.flatMap', () => {
  assertEquals(Chain.of(1).flatMap((it) => Chain.of(it + 1)).value, 2)
})

Deno.test('Chain.toAsync', async () => {
  assertEquals(await Chain.of(1).toAsync().promise, 1)
})

Deno.test('Chain.mapAsync', async () => {
  assertEquals(
    await Chain.of(1)
      .mapAsync(async (it) => {
        await std.async.delay(0)
        return it + 1
      })
      .promise,
    2,
  )
})

Deno.test('Chain.flatMapAsync', async () => {
  assertEquals(
    await Chain.of(1)
      .flatMapAsync<number>(async (it) => {
        await std.async.delay(0)
        return Chain.of<number>(it + 1)
      })
      .promise,
    2,
  )

  assertEquals(
    await Chain.of(1)
      .flatMapAsync<number>(async (it) => {
        await std.async.delay(0)
        return Chain.of<number>(it + 1).toAsync()
      })
      .promise,
    2,
  )
})
