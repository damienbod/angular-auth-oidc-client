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
    createDirectoryFirst: true,
  },
  collectionJson: {
    source: './projects/schematics/src/collection.json',
    target: './dist/angular-auth-oidc-client/schematics',
  },
  jsonSchema: {
    source: './projects/schematics/src/ng-add/schema.json',
    target: './dist/angular-auth-oidc-client/schematics/ng-add/schema.json',
  },
  schematicsPackageJson: {
    source: './projects/schematics/package.json',
    target: './dist/angular-auth-oidc-client/schematics/package.json',
  },
};

shell.echo('Start copying files...');

Object.entries(toCopy).forEach(([_, value]) => {
  const { source, target, createDirectoryFirst } = value;

  if (!!createDirectoryFirst) {
    shell.mkdir('-p', `${target}`);
  }

  shell.echo(`Copying from ${source} to ${target}`);
  shell.cp('-r', `${source}`, `${target}`);
});

shell.echo('...DONE');
