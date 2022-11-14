import TemplateLinter, { LintResult } from 'ember-template-lint';
import { ActTestRunner, TestCase, TestResult } from 'act-tools';

const actRunner = new ActTestRunner({
  fileTypes: ['html'],
  implementor: `ember-template-lint`
});

// Tell ActRunner where to load & store the reports
const reportRoot = `./reports/ember-template-lint/`
actRunner.setReporting({
  earlReport: `${reportRoot}/ember-earl.json`,
  actReport: `${reportRoot}/ember-act-report.json`,
  ruleMapping: `${reportRoot}/ember-rule-mapping.json`,
});

// Run ACT test cases
actRunner.run(async (testCase: TestCase, procedureIds?: string[]) => {
  // Create the linter
  const config = getConfig(procedureIds);
  const linter = new TemplateLinter({ config });

  // Run ember-template-lint
  const filePath = testCase.relativePath;
  const source = await testCase.fetchSource({ assertNoRender: true });
  const results = await linter.verify({ filePath, source });

  // Convert the results to the expected report
  return getFailedProcedureIds(results).map(procedureId => ({
    procedureId,
    outcome: 'failed',
    requirementsFromDocs:
      'https://github.com/ember-template-lint/ember-template-lint/' +
      `blob/master/docs/rule/${procedureId}.md`
  }))
});

// Create EmberTemplateLint config object
function getConfig(procedureIds?: string[]): any {
  if (!procedureIds) {
    return { extends: 'a11y' } // Default, run all a11y rules
  }
  const rules: Record<string, boolean> = {}
  for (const procedureId of procedureIds) {
    rules[procedureId] = true;
  }
  return { rules };
}

function getFailedProcedureIds(results: LintResult[]): string[] {
  const procedureIds: string[] = []
  for (const { rule: procedureId } of results) {
    if (procedureId) procedureIds.push(procedureId);
  }
  return procedureIds;
}
