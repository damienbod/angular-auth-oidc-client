const shell = require('shelljs');
// "schematics-ngadd-copy": "ncp projects/schematics/src/ng-add/files ./dist/angular-auth-oidc-client/schematics/ng-add/files && ncp projects/schematics/src/ng-add/schema.json ./dist/angular-auth-oidc-client/schematics/ng-add/schema.json",

// const BASE_HREF = './';
// const OUTPUT_TEMP_PATH = '.temp/desktop';
// const OUTPUT_DIST_PATH = 'dist/apps/desktop';
// const ICON_PATH = 'assets/desktop/icon';
const NG_ADD_FILES_SOURCE = './projects/schematics/src/ng-add/files/*';
const NG_ADD_FILES_TARGET = './dist/angular-auth-oidc-client/schematics/ng-add/files';
// const ELECTRON_VERSION = '11.1.1';

// shell.echo('Start copying files');

// // DELETE TEMP FOLDER
// shell.rm('-rf', `${OUTPUT_TEMP_PATH}`);
// shell.rm('-rf', `${OUTPUT_DIST_PATH}`);
// shell.echo('Deleted temp and dist folders...');

// // BUILD ANGULAR
// console.log(chalk.green('build angular'));
// const angularBuildCommand = `ng build --base-href ${BASE_HREF} --output-path=${OUTPUT_TEMP_PATH}`;
// shell.exec(angularBuildCommand);

// // COPY ASSETS
shell.mkdir('-p', `${NG_ADD_FILES_TARGET}`);
shell.cp('-r', `${NG_ADD_FILES_SOURCE}`, `${NG_ADD_FILES_TARGET}`);

// // BUILD DESKTOP
// console.log(chalk.green('build desktop'));
// shell.exec(
//   `npx electron-packager ${OUTPUT_TEMP_PATH} --electronVersion=${ELECTRON_VERSION} --overwrite --icon=${ICON_PATH} --platform=win32,linux --out=${OUTPUT_DIST_PATH}`
// );

// console.log(chalk.green('DONE'));
