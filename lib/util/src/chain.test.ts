import { std } from 'deps.ts'
import { assertEquals } from 'test/deps.ts'
import { AsyncChain, Chain } from './chain.ts'

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

Deno.test('Chain.flatten', () => {
  assertEquals(Chain.flatten(Chain.of(Chain.of(1))).value, 1)
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
        return AsyncChain.of<number>(Promise.resolve(it + 1))
      })
      .promise,
    2,
  )
})

Deno.test('AsyncChain.of', async () => {
  assertEquals(await AsyncChain.of(Promise.resolve(1)).promise, 1)
  assertEquals(await AsyncChain.of(1).promise, 1)
  assertEquals(await AsyncChain.of(Promise.resolve(null)).promise, null)
  assertEquals(await AsyncChain.of(undefined).promise, undefined)
})

Deno.test('AsyncChain.ofNullable', async () => {
  assertEquals(await AsyncChain.ofNullable(Promise.resolve(1)).promise, 1)
  assertEquals(await AsyncChain.ofNullable(1).promise, 1)
  assertEquals(
    await AsyncChain.ofNullable<number>(Promise.resolve(null)).promise,
    undefined,
  )
  assertEquals(await AsyncChain.ofNullable<number>(null).promise, undefined)
  assertEquals(
    await AsyncChain.ofNullable<number>(Promise.resolve(undefined)).promise,
    undefined,
  )
  assertEquals(
    await AsyncChain.ofNullable<number>(undefined).promise,
    undefined,
  )
})

Deno.test('AsyncChain.with', async () => {
  assertEquals(await AsyncChain.with(() => Promise.resolve(1)).promise, 1)
  assertEquals(await AsyncChain.with(() => 1).promise, 1)
  assertEquals(await AsyncChain.with(() => Promise.resolve(null)).promise, null)
  assertEquals(await AsyncChain.with(() => undefined).promise, undefined)
})

Deno.test('AsyncChain.empty', async () => {
  assertEquals(await AsyncChain.empty<number>().promise, undefined)
})

Deno.test('AsyncChain.flatten', async () => {
  assertEquals(
    await AsyncChain.flatten(AsyncChain.of(AsyncChain.of(1))).promise,
    1,
  )
  assertEquals(
    await AsyncChain.flatten(AsyncChain.of(Chain.of(1))).promise,
    1,
  )
  assertEquals(
    await AsyncChain.flatten(Chain.of(AsyncChain.of(1))).promise,
    1,
  )
})

Deno.test('AsyncChain.tapAsync', async () => {
  let value: number | undefined = undefined
  await AsyncChain.of(1).tapAsync((it) => (value = it)).promise
  assertEquals(value, 1)
  await AsyncChain.of(2)
    .tapAsync(async (it) => {
      await std.async.delay(0)
      value = it
    })
    .promise
  assertEquals(value, 2)
})

Deno.test('AsyncChain.mapAsync', async () => {
  assertEquals(
    await AsyncChain.of(1)
      .mapAsync(async (it) => {
        await std.async.delay(0)
        return it + 1
      })
      .promise,
    2,
  )
})

Deno.test('AsyncChain.flatMapAsync', async () => {
  assertEquals(
    await AsyncChain.of(1)
      .flatMapAsync<number>(async (it) => {
        await std.async.delay(0)
        return AsyncChain.of<number>(Promise.resolve(it + 1))
      })
      .promise,
    2,
  )
  assertEquals(
    await AsyncChain.of(1)
      .flatMapAsync<number>(async (it) => {
        await std.async.delay(0)
        return Chain.of<number>(it + 1)
      })
      .promise,
    2,
  )
  assertEquals(
    await AsyncChain.of(1)
      .flatMapAsync<number>((it) => Chain.of<number>(it + 1))
      .promise,
    2,
  )
  assertEquals(
    await AsyncChain.of(1)
      .flatMapAsync<number>((it) => AsyncChain.of<number>(it + 1))
      .promise,
    2,
  )
})
