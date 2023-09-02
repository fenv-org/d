import { std_semvar } from '../../deps.ts'
import { VERSION_STRING } from './version.ts'

/**
 * The semantic version of `fpm`.
 */
export const fpmVersion: std_semvar.SemVer = std_semvar.parse(VERSION_STRING)
