import fs from 'node:fs';
import path from 'node:path';
// Deliberately never serialize Playwright error objects, call arguments, headers or attachments.
export default class SanitizedSandboxReporter {
  results = [];
  onTestEnd(test, result) {
    this.results.push({ name: test.title, status: result.status, duration_ms: result.duration,
      error_count: result.errors.length });
    console.log(`${result.status}: ${test.title}`);
  }
  onError() { console.error('Sandbox test infrastructure failed; raw details suppressed to protect credentials.'); }
  onEnd(result) {
    const report = { at: new Date().toISOString(), scope: 'actual protected-preview browser to isolated Xano', status: result.status, tests: this.results };
    const dir = process.env.ZIPPY_SANDBOX_EVIDENCE_DIR || 'sandbox-test-results';
    fs.mkdirSync(dir, { recursive: true }); fs.writeFileSync(path.join(dir, 'browser-result.json'), JSON.stringify(report, null, 2) + '\n');
  }
}
