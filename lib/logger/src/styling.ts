import { std } from 'deps.ts'

export type Styling = (message: string) => string

export type StylingChain =
  & Chainable<StylingCatalog>
  & { _queue: Array<StylingMethodName> }

export type Styles = StylingChain & (() => Styles)

export type StylingMethodName = Exclude<PropertyNames, ExcludedStylerMethods>

export type StylingCatalog = Record<StylingMethodName, Styling>

export function createStyles(options: { supportColors: boolean }): Styles {
  const { supportColors } = options
  const proto = Object.create(null)

  for (const name of stylerMethodNames) {
    Object.defineProperty(proto, name, {
      get(this: StylingChain) {
        return factory([...this._queue, name])
      },
    })
  }

  function factory(queue: Array<StylingMethodName> = []): Styles {
    const styles: Styles = function (
      this: StylingChain | undefined,
      str?: string,
    ): string | StylingChain {
      if (typeof str !== 'undefined') {
        return queue.reduce(
          (str, name) =>
            supportColors ? (std.fmt.colors[name] as Styling)(str) : str,
          str,
        )
      }
      const tmp = queue.slice()
      queue = []
      return factory(tmp)
    } as Styles

    Object.setPrototypeOf(styles, proto)
    styles._queue = queue
    return styles
  }

  return factory()
}

type Chainable<T> = {
  [P in keyof T]: Chainable<T> & T[P]
}

type ExcludedStylerMethods =
  | 'setColorEnabled'
  | 'getColorEnabled'
  | 'rgb8'
  | 'bgRgb8'
  | 'rgb24'
  | 'bgRgb24'
  | 'stripColor'

type PropertyNames = keyof typeof std.fmt.colors

const stylerMethodNames: StylingMethodName[] =
  (Object.keys(std.fmt.colors) as Array<PropertyNames>).filter(
    (name): name is StylingMethodName => {
      switch (name) {
        case 'setColorEnabled':
        case 'getColorEnabled':
        case 'rgb8':
        case 'bgRgb8':
        case 'rgb24':
        case 'bgRgb24':
        case 'stripColor':
          return false
        default:
          return true
      }
    },
  )
