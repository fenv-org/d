import { std } from '../../deps.ts'
import { DENO_VERSION } from './deno_version.ts'
import { VERSION_STRING } from './version.ts'

/**
 * The semantic version of `d`.
 */
export const version: std.semvar.SemVer = std.semvar.parse(VERSION_STRING)

/**
 * The latest deno version that is confirmed that the current `d` is working
 * with.
 */
export const denoVersion: std.semvar.SemVer = std.semvar.parse(DENO_VERSION)
