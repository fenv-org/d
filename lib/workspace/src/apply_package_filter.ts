import { PackageFilterOptions } from '../../command/common/mod.ts'
import { DartProject } from '../../dart/mod.ts'
import { std } from '../../deps.ts'
import { Chain } from '../../util/mod.ts'

export async function applyPackageFilterOptions(
  dartProjects: DartProject[],
  options: PackageFilterOptions,
): Promise<DartProject[]> {
  return await Chain
    .of(dartProjects)
    .mapAsync((it) => applyFileExistsOptions(it, options.fileExists))
    .mapAsync((it) => applyNoFileExistsOptions(it, options.noFileExists))
    .mapAsync((it) => applyDirExistsOptions(it, options.dirExists))
    .mapAsync((it) => applyNoDirExistsOptions(it, options.noDirExists))
    .promise
}

function applyFileExistsOptions(
  dartProjects: DartProject[],
  fileExists: string[] | undefined,
): Promise<DartProject[]> {
  std.assert.unimplemented()
}

function applyNoFileExistsOptions(
  dartProjects: DartProject[],
  noFileExists: string[] | undefined,
): Promise<DartProject[]> {
  std.assert.unimplemented()
}

function applyDirExistsOptions(
  dartProjects: DartProject[],
  dirExists: string[] | undefined,
): Promise<DartProject[]> {
  std.assert.unimplemented()
}

function applyNoDirExistsOptions(
  dartProjects: DartProject[],
  noDirExists: string[] | undefined,
): Promise<DartProject[]> {
  std.assert.unimplemented()
}
