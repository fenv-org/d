import { std } from '../../deps.ts'
import { VERSION_STRING } from './version.ts'

/**
 * The semantic version of `fpm`.
 */
export const version: std.semvar.SemVer = std.semvar.parse(VERSION_STRING)
