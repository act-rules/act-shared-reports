import TemplateLinter from 'ember-template-lint';
import { ActTestRunner, TestCase } from 'act-tools';
import { writeFileSync } from 'fs';

const config = { extends: 'a11y' };
let linter = new TemplateLinter({ config });

(async () => {
  const actRunner = new ActTestRunner({
    fileTypes: ['html'],
    implementor: {
      name: 'ember-template-lint',
      vendorName: 'ember-template-lint',
      versionNumber: '4.16.1'
    }
  });

  const actReport = await actRunner.run(async (testCase: TestCase) => {
    const source = await testCase.fetchSource();
    const filePath = testCase.relativePath;
    const results = await linter.verify({ source, filePath });
    return results.map(({ rule }) => rule);
  });

  const earlText = JSON.stringify(actReport.getEarlReport(), null, 2);
  writeFileSync('./earl/ember-template-lint.json', earlText, 'utf8');

  const { approvedRules, proposedRules } = actReport.getImplementationMapping();
  console.table({ approvedRules, proposedRules });
})();
