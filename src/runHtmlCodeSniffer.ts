import puppeteer, { Page } from 'puppeteer-core';
import { ActTestRunner, TestCase, TestResult } from 'act-tools';

type HtmlCsIssue = {
  type: 1 | 2 | 3
  message: string
  code: string
}

declare global {
  interface Window {
    HTMLCS: {
      process: (standard: string, document: Document, callback: () => void) => void;
      getMessages: () => HtmlCsIssue[];
    };
  }
}

const actRunner = new ActTestRunner({
  fileTypes: ['html'],
  implementor: `html-code-sniffer`
});

// Tell ActRunner where to load & store the reports
const reportRoot = `./reports/html-code-sniffer`
actRunner.setReporting({
  earlReport: `${reportRoot}/htmlcs-earl.json`,
  actReport: `${reportRoot}/htmlcs-act-report.json`,
  ruleMapping: `${reportRoot}/htmlcs-rule-mapping.json`,
});

(async () => {
  const executablePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  const browser = await puppeteer.launch({ executablePath });
  const page = await browser.newPage();

  // Run ACT test cases
  await actRunner.run(async (testCase: TestCase, procedureIds?: string[]) => {
    if (Array.isArray(procedureIds) && procedureIds.length === 0) {
      return; // Not covered, can be skipped
    }
    const { url } = testCase;
    await page.goto(url);
    const results = await runHtmlCS(page);
    return htmlCsToActResult(results);
  });

  await browser.close();
})();


async function runHtmlCS(page: Page): Promise<HtmlCsIssue[]> {
  await page.addScriptTag({
    url: 'https://squizlabs.github.io/HTML_CodeSniffer/build/HTMLCS.js'
  });

  return page.evaluate((): Promise<HtmlCsIssue[]> => {
    const { HTMLCS } = window;
    return new Promise(res => {
      HTMLCS.process('WCAG2AA', window.document, () => {
        res(HTMLCS.getMessages());
      });
    })
  });
}

function htmlCsToActResult(results: HtmlCsIssue[]): TestResult[] {
  // Remove notices
  results = results.filter(({ type }) => type !== 3);
  // Convert format
  return results.map(({ type, code }): TestResult => ({
    procedureId: code.split('.').splice(3).join('.'),
    outcome: type === 1 ? 'failed': 'cantTell',
    wcag2: getWcagScs(code),
  }))
}

function getWcagScs(code: string): string[] {
  const sc = code.split('.')[3]
  if (typeof sc !== 'string') {
    return []
  }
  return [`SC ${sc.replaceAll('_', '.')}`]
}
