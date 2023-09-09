export type Options =
  & {
    cwd: string
    args: string[]
  }
  & GlobalOptions
  & ({
    name: 'bootstrap'
    options: PackageFilterOptions
  })

export type GlobalOptions = {
  verbose: boolean
  debug: boolean
  config?: string
  dWorkspace?: string
}

export type PackageFilterOptions = {
  fileExists: string[]
  dirExists: string[]
}
