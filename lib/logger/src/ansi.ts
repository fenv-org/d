import { Styling } from './styling.ts'

export interface Ansi {
  readonly color: {
    readonly command: Styling
    readonly commandLabel: Styling
    readonly successMessage: Styling
    readonly successLabel: Styling
    readonly warningMessage: Styling
    readonly warningLabel: Styling
    readonly errorMessage: Styling
    readonly errorLabel: Styling
    readonly hintMessage: Styling
    readonly hintLabel: Styling
    readonly dryRunWarningMessage: Styling
    readonly dryRunWarningLabel: Styling
  }

  readonly label: {
    readonly success: string
    readonly warning: string
    readonly error: string
    readonly failed: string
    readonly hint: string
    readonly running: string
    readonly check: string
  }

  readonly style: {
    readonly command: Styling
    readonly success: Styling
    readonly label: Styling
    readonly target: Styling
    readonly packagePath: Styling
    readonly packageName: Styling
    readonly errorPackageName: Styling
    readonly verbose: Styling
    readonly debug: Styling
  }
}
