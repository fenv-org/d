import { delay } from 'https://deno.land/std@0.201.0/async/mod.ts'
import { Traversal, VisitResult } from './lib/concurrency/mod.ts'
import { cliffy_ansi } from './lib/deps.ts'

function main() {
  const graph = {
    nodes: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map((n) =>
      String(n)
    ),
    inboundEdges: {
      // Generate the edges like: https://i.stack.imgur.com/zuLmn.png
      '0': ['13', '10', '7'],
      '1': ['2', '9', '13'],
      '2': ['12', '13', '10', '14'],
      '3': ['9', '6', '8'],
      '4': ['7'],
      '5': ['10', '7', '9', '6'],
      '6': ['15'],
      '7': ['14'],
      '8': ['15'],
      '9': ['11', '14'],
      '10': ['14'],
      '11': [],
      '12': [],
      '13': [],
      '14': [],
      '15': [],
    },
  }

  const traversal = Traversal.fromGraph({
    ...graph,
    onVisit: onVisit,
    concurrency: 20,
  })
  traversal.start()
}

async function onVisit(node: string): Promise<VisitResult> {
  console.log(cliffy_ansi.colors.brightRed('[main]'), `[${node}]`, 'visiting')
  await delay((parseInt(node) + 1) * 1000)
  console.log(cliffy_ansi.colors.brightRed('[main]'), `[${node}]`, 'done')
  return Promise.resolve(VisitResult.Continue)
}

main()
