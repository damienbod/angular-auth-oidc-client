/* eslint-env es6 */
// Reads the Istanbul json-summary written by `npm run test-lib-ci` and
//  - writes a shields.io endpoint file (https://shields.io/badges/endpoint-badge)
//    to the path given as the first argument, if any
//  - appends a coverage table to the GitHub job summary, when run in Actions
const fs = require('fs');
const path = require('path');

const summaryFile = path.join(
  __dirname,
  '..',
  'coverage',
  'angular-auth-oidc-client',
  'coverage-summary.json'
);
const badgeFile = process.argv[2];

const { total } = JSON.parse(fs.readFileSync(summaryFile, 'utf8'));
const pct = total.lines.pct;

const color =
  pct >= 90
    ? 'brightgreen'
    : pct >= 80
      ? 'green'
      : pct >= 70
        ? 'yellow'
        : pct >= 60
          ? 'orange'
          : 'red';

if (badgeFile) {
  fs.mkdirSync(path.dirname(badgeFile), { recursive: true });
  fs.writeFileSync(
    badgeFile,
    JSON.stringify(
      { schemaVersion: 1, label: 'coverage', message: `${pct}%`, color },
      null,
      2
    ) + '\n'
  );
  console.log(`Wrote ${badgeFile}: ${pct}% (${color})`);
}

if (process.env.GITHUB_STEP_SUMMARY) {
  const rows = ['lines', 'statements', 'functions', 'branches']
    .map(
      (k) =>
        `| ${k} | ${total[k].pct}% | ${total[k].covered} / ${total[k].total} |`
    )
    .join('\n');
  fs.appendFileSync(
    process.env.GITHUB_STEP_SUMMARY,
    `### Coverage\n\n| | % | covered |\n|---|---|---|\n${rows}\n`
  );
}

console.log(`Line coverage: ${pct}%`);
