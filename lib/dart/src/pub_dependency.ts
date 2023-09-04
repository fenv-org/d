/**
 * https://dart.dev/tools/pub/dependencies
 */
export type PubDependency =
  | NameOnlyPackage
  | HostPackage
  | GitPackage
  | PathPackage
  | SdkPackage

export type NameOnlyPackage = Record<string | number | symbol, never>

export type HostPackage =
  | {
    readonly hosted: string | {
      readonly name: string
      readonly url: string
    }
    readonly version?: string
  }
  | string

export type GitPackage = {
  readonly git: string | {
    readonly url: string
    readonly ref?: string
    readonly path?: string
  }
}

export type PathPackage = {
  readonly path: string
}

export type SdkPackage = {
  readonly sdk: 'flutter' | string
}
