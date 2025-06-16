/* eslint-env es6 */
const { execSync } = require('child_process');

const fileExtensions = {
  ts: /\.ts$/,
  json: /\.json$/,
  spec: /\.spec\.ts$/,
};

/** Map of forbidden words and their match regex */
const words = {
  debugger: { matcher: '(debugger);?', extension: fileExtensions.ts },
  fit: { matcher: '\\s*fit\\(', extension: fileExtensions.spec },
  '.skip': { matcher: '\\.skip\\(', extension: fileExtensions.spec },
  '.only': { matcher: '\\.only\\(', extension: fileExtensions.spec },
  fdescribe: { matcher: '\\s*fdescribe\\(', extension: fileExtensions.spec },
  xdescribe: { matcher: '\\s*xdescribe\\(', extension: fileExtensions.spec },
  xit: { matcher: '\\sxit\\(', extension: fileExtensions.spec },
};

let status = 0;

for (let [word, { extension, matcher }] of Object.entries(words)) {
  const gitCommand = `git diff --staged -G"${matcher}" --name-only`;
  const failedFiles = execSync(gitCommand).toString();
  const filesAsArray = failedFiles.split('\n');
  const supportedFiles = filesAsArray.filter((file) =>
    extension.test(file.trim())
  );

  if (supportedFiles.length) {
    status = 1;
    console.log(`The following files contains '${word}' in them:`);
    console.log(supportedFiles.join('\n'));
  }
}
process.exit(status);
