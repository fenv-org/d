import { std } from 'deps.ts'
import { assertEquals } from 'test/deps.ts'
import { createStyles } from './styling.ts'

const colors = std.fmt.colors

Deno.test('supportColors', async (t) => {
  const styles = createStyles({ supportColors: true })

  await t.step('red', () => {
    const str = styles.red('hello')
    console.log(str)
    assertEquals(str, colors.red('hello'))
  })

  await t.step('bold.bgBlue', () => {
    const str = styles.bold.bgBlue('hello')
    console.log(str)
    assertEquals(str, colors.bgBlue(colors.bold('hello')))
  })

  await t.step('yellow.italic.underline', () => {
    const str = styles.yellow.italic.underline('hello')
    console.log(str)
    assertEquals(str, colors.underline(colors.italic(colors.yellow('hello'))))
  })
})

Deno.test('no supportColors', async (t) => {
  const styles = createStyles({ supportColors: false })

  await t.step('red', () => {
    const str = styles.red('hello')
    console.log(str)
    assertEquals(str, 'hello')
  })

  await t.step('bold.bgBlue', () => {
    const str = styles.bold.bgBlue('hello')
    console.log(str)
    assertEquals(str, 'hello')
  })

  await t.step('yellow.italic.underline', () => {
    const str = styles.yellow.italic.underline('hello')
    console.log(str)
    assertEquals(str, 'hello')
  })
})
