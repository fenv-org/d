/**
 * The definition of `d`'s command line arguments.
 */
export type Options =
  & {
    readonly cwd: string
    readonly args: string[]
  }
  & GlobalOptions
  & ({
    readonly name: 'bootstrap'
    readonly options: PackageFilterOptions
  })

/**
 * The definition of `d`'s global command flags.
 */
export type GlobalOptions = {
  readonly verbose: boolean
  readonly debug: boolean
  readonly config?: string
  readonly dWorkspace?: string
}

/**
 * Additional package filters.
 */
export type PackageFilterOptions = {
  readonly fileExists: string[]
  readonly dirExists: string[]
}
