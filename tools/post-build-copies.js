const shell = require('shelljs');

const toCopy = {
  readme: {
    source: './README.md',
    target: './dist/angular-auth-oidc-client',
  },
  license: {
    source: './LICENSE',
    target: './dist/angular-auth-oidc-client',
  },
  ngAdd: {
    source: './projects/schematics/src/ng-add/files/*',
    target: './dist/angular-auth-oidc-client/schematics/ng-add/files',
    createFirectoryFirst: true,
  },
  collectionJson: {
    source: './projects/schematics/src/collection.json',
    target: './dist/angular-auth-oidc-client/schematics',
  },
  jsonSchema: {
    source: './projects/schematics/src/ng-add/schema.json',
    target: './dist/angular-auth-oidc-client/schematics/ng-add/schema.json',
  },
};

shell.echo('Start copying files...');

Object.entries(toCopy).forEach(([_, value]) => {
  const { source, target, createFirectoryFirst } = value;

  if (!!createFirectoryFirst) {
    shell.mkdir('-p', `${target}`);
  }

  shell.echo(`Copying from ${source} to ${target}`);
  shell.cp('-r', `${source}`, `${target}`);
});

// shell.cp('-r', `${NG_ADD_FILES_SOURCE}`, `${NG_ADD_FILES_TARGET}`);
// shell.cp('-r', `${SCHEMA_JSON_SOURCE}`, `${SCHEMA_JSON_TARGET}`);

// // BUILD DESKTOP
// console.log(chalk.green('build desktop'));
// shell.exec(
//   `npx electron-packager ${OUTPUT_TEMP_PATH} --electronVersion=${ELECTRON_VERSION} --overwrite --icon=${ICON_PATH} --platform=win32,linux --out=${OUTPUT_DIST_PATH}`
// );

shell.echo('...DONE');
