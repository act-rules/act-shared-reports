import { ActTestRunner } from 'act-tools';
import { ESLint, Linter } from 'eslint';

const actRunner = new ActTestRunner({
  rules: ['73f2c2'],
  fileTypes: ['html'],
  implementor: `eslint-plugin-jsx-a11y`
});

// Tell ActRunner where to load & store the reports
const reportRoot = `./reports/eslint-plugin-jsx-a11y/`
actRunner.setReporting({
  earlReport: `${reportRoot}/jsx-a11y-earl.json`,
  actReport: `${reportRoot}/jsx-a11y-act-report.json`,
  // ruleMapping: `${reportRoot}/jsx-a11y-rule-mapping.json`,
});

actRunner.run(async (testCase, procedureIds) => {
  // Create Linter
  const baseConfig = getConfig(procedureIds);
  const linter = new ESLint({ baseConfig });

  // Run ESLint with jsx-a11y rules
  const pageCode = await testCase.fetchSource({ format: 'jsx', assertNoRender: true });
  const results = await linter.lintText(pageCode);

  // Convert the results to the expected report
  return getFailedProcedureIds(results).map((procedureId) => ({
    procedureId,
    outcome: 'failed',
    requirementsFromDocs: 
      'https://github.com/jsx-eslint/eslint-plugin-jsx-a11y/' +
      `blob/main/docs/rules/${procedureId}.md`
  }));
});

// Create EmberTemplateLint config object
function getConfig(procedureIds?: string[]): Linter.Config {
  const plugins = ['jsx-a11y'];
  const recommended = ["plugin:jsx-a11y/recommended"];
  if (!procedureIds) { // Default, run recommended jsx-a11y rules
    return { plugins, extends: recommended };
  }

  const rules: Linter.RulesRecord = {}
  for (const procedureId of procedureIds) {
    rules[`jsx-a11y/${procedureId}`] = 'error'
  }
  return  { plugins, rules }
}

function getFailedProcedureIds(results: ESLint.LintResult[]): string[] {
  const jsxA11yProcedures: string[] = []
  for (const { messages } of results) {
    for (const { ruleId } of messages) {
      if (ruleId?.indexOf('jsx-a11y/') === 0) {
        jsxA11yProcedures.push(ruleId.replace('jsx-a11y/', ''));
      }
    }
  }
  return jsxA11yProcedures
}
