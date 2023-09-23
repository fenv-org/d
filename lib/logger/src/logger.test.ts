import { assertEquals, Buffer } from '../../test_deps.ts'
import { createStyles } from '../mod.ts'
import { createLogger } from './logger.ts'

const LINE_FEED = Deno.build.os === 'windows' ? '\r\n' : '\n'

function bufferToString(buffer: Buffer): string {
  const decoder = new TextDecoder()
  return decoder.decode(buffer.bytes())
}

Deno.test('supportColors & verbose & debug', async (t) => {
  let now = 0
  const stdout = new Buffer()
  const stderr = new Buffer()
  const logger = createLogger({
    stdout,
    stderr,
    supportColors: true,
    verboseEnabled: true,
    debugEnabled: true,
    now: () => now,
  })
  const styles = createStyles({ supportColors: true })

  await t.step('verbose', () => {
    // advance 10 minutes 30 seconds
    now += 1000 * 60 * 10 + 1000 * 30
    logger.stdout({ verbose: true })
      .timestamp()
      .package('test')
      .indent()
      .childArrow()
      .pushCharCode(36)
      .pushCharCode(32)
      .push('Hello')
      .push(' ')
      .push((s) => s.bgBlue.italic.bold('world'))
      .lineFeed()
    console.log(bufferToString(stdout))
    assertEquals(
      bufferToString(stdout),
      styles.gray.bold('[10m 30.000s]') + ' ' +
        '[' + styles.blue.bold('test') + ']   ' +
        styles.brightGreen.bold('└>') + ' ' +
        '$ Hello ' + styles.bgBlue.italic.bold('world') + LINE_FEED,
    )
  })

  stdout.reset()
  stderr.reset()

  await t.step('debug', () => {
    // advance 123 milliseconds
    now += 123
    logger.stderr({ debug: true, timestamp: true })
      .package('test')
      .indent()
      .childArrow()
      .pushCharCode(36)
      .pushCharCode(32)
      .push('Hello')
      .push(' ')
      .push((s) => s.bgBlue.italic.bold('world'))
      .lineFeed()
    console.log(bufferToString(stderr))
    assertEquals(
      bufferToString(stderr),
      styles.gray.bold('[10m 30.123s]') + ' ' +
        '[' + styles.blue.bold('test') + ']   ' +
        styles.brightGreen.bold('└>') + ' ' +
        styles.magenta('$') + styles.magenta(' ') +
        styles.magenta('Hello') + styles.magenta(' ') +
        styles.bgBlue.italic.bold('world') + LINE_FEED,
    )
  })

  stdout.reset()
  stderr.reset()

  await t.step('simple message', () => {
    // advance 10 minutes 30 seconds
    now += 1000 * 60 * 10 + 1000 * 30
    logger.stdout().push('Hello world').lineFeed()
    console.log(bufferToString(stdout))
    assertEquals(
      bufferToString(stdout),
      'Hello world' + LINE_FEED,
    )
  })
})

Deno.test('!supportColors & verbose & debug', async (t) => {
  let now = 0
  const stdout = new Buffer()
  const stderr = new Buffer()
  const logger = createLogger({
    stdout,
    stderr,
    supportColors: false,
    verboseEnabled: true,
    debugEnabled: true,
    now: () => now,
  })

  await t.step('verbose', () => {
    // advance 10 minutes 30 seconds
    now += 1000 * 60 * 10 + 1000 * 30
    logger.stdout({ verbose: true })
      .timestamp()
      .package('test')
      .indent()
      .childArrow()
      .pushCharCode(36)
      .pushCharCode(32)
      .push('Hello')
      .push(' ')
      .push((s) => s.bgBlue.italic.bold('world'))
      .lineFeed()
    console.log(bufferToString(stdout))
    assertEquals(
      bufferToString(stdout),
      '[10m 30.000s] [test]   └> $ Hello world' + LINE_FEED,
    )
  })

  stdout.reset()
  stderr.reset()

  await t.step('debug', () => {
    // advance 123 milliseconds
    now += 123
    logger.stderr({ debug: true, timestamp: true })
      .package('test')
      .indent()
      .childArrow()
      .pushCharCode(36)
      .pushCharCode(32)
      .push('Hello')
      .push(' ')
      .push((s) => s.bgBlue.italic.bold('world'))
      .lineFeed()
    console.log(bufferToString(stderr))
    assertEquals(
      bufferToString(stderr),
      '[10m 30.123s] [test]   └> $ Hello world' + LINE_FEED,
    )
  })

  stdout.reset()
  stderr.reset()

  await t.step('simple message', () => {
    // advance 10 minutes 30 seconds
    now += 1000 * 60 * 10 + 1000 * 30
    logger.stdout().push('Hello world').lineFeed()
    console.log(bufferToString(stdout))
    assertEquals(
      bufferToString(stdout),
      'Hello world' + LINE_FEED,
    )
  })
})

Deno.test('supportColors & !verbose & !debug', async (t) => {
  let now = 0
  const stdout = new Buffer()
  const stderr = new Buffer()
  const logger = createLogger({
    stdout,
    stderr,
    supportColors: true,
    now: () => now,
  })

  await t.step('verbose', () => {
    // advance 10 minutes 30 seconds
    now += 1000 * 60 * 10 + 1000 * 30
    logger.stdout({ verbose: true })
      .timestamp()
      .package('test')
      .indent()
      .childArrow()
      .pushCharCode(36)
      .pushCharCode(32)
      .push('Hello')
      .push(' ')
      .push((s) => s.bgBlue.italic.bold('world'))
      .lineFeed()
    assertEquals(bufferToString(stdout), '')
  })

  stdout.reset()
  stderr.reset()

  await t.step('debug', () => {
    // advance 123 milliseconds
    now += 123
    logger.stderr({ debug: true, timestamp: true })
      .package('test')
      .indent()
      .childArrow()
      .pushCharCode(36)
      .pushCharCode(32)
      .push('Hello')
      .push(' ')
      .push((s) => s.bgBlue.italic.bold('world'))
      .lineFeed()
    assertEquals(bufferToString(stderr), '')
  })

  stdout.reset()
  stderr.reset()

  await t.step('simple message', () => {
    // advance 10 minutes 30 seconds
    now += 1000 * 60 * 10 + 1000 * 30
    logger.stdout().push('Hello world').lineFeed()
    console.log(bufferToString(stdout))
    assertEquals(bufferToString(stdout), 'Hello world' + LINE_FEED)
  })
})
