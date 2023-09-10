import { dMain } from '../../../d.ts'
import { Buffer } from '../../../test_deps.ts'

Deno.test('Show graph', async (t) => {
  // setup
  Deno.env.set('D_LOG_TIME', '0')
  const stdout = new Buffer()
  const stderr = new Buffer()

  await t.step('call graphCommand()', async () => {
    await dMain(['graph', '-v'], {
      cwd: 'test-sample/packages/pack-a',
      stdout,
      stderr,
      colorSupported: false,
    })

    const decoder = new TextDecoder()
    console.log(decoder.decode(stdout.bytes()))
    console.log(decoder.decode(stderr.bytes()))
  })

  // tear down
  Deno.env.delete('D_LOG_TIME')
})
