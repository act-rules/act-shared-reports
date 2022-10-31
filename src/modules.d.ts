declare module 'ember-template-lint' {
  type VerifyArg = {
    source: string,
    filePath: string
  }

  type LintResult = {
    rule: string
    severity: number
    filePath: string
    line: number
    column: number
    endLine: number
    endColumn: number
    source: string
    message: string
  }

  export default class TemplateLinter {
    constructor(arg: any)
    verify(arg: VerifyArg): Promise<LintResult[]>
  }
}
