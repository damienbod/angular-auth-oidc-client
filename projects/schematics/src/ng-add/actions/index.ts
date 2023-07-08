import { Tree, noop } from '@angular-devkit/schematics';
import { Schema } from '../schema';
import { addPackageJsonDependencies } from './add-dependencies';
import { addModuleToImports } from './add-module-import';
import { addStandaloneConfigsToProviders } from './add-standalone-import';
import { addSilentRenewHtmlToAssetsArrayInAngularJson } from './adding-entry-to-assets';
import { copyModuleFile } from './copy-module-file';
import { copySilentRenewHtmlToRoot } from './copy-silent-renew-html';
import { copyStandaloneFile } from './copy-standalone-file';
import { installPackageJsonDependencies } from './install-dependencies';
import { runChecks } from './run-checks';
import { parseSchema } from './schema-parser';

export async function getAllActions(host: Tree, options: Schema) {
  const ngAddOptions = await parseSchema(host, options);

  return [
    runChecks(),
    addPackageJsonDependencies(ngAddOptions),
    installPackageJsonDependencies(),
    
    ngAddOptions.moduleInfo ? copyModuleFile(ngAddOptions) : noop(),
    ngAddOptions.moduleInfo ? addModuleToImports(ngAddOptions) : noop(),
    
    ngAddOptions.standaloneInfo ? copyStandaloneFile(ngAddOptions) : noop(),
    ngAddOptions.standaloneInfo ? addStandaloneConfigsToProviders(ngAddOptions) : noop(),
    
    addSilentRenewHtmlToAssetsArrayInAngularJson(ngAddOptions),
    copySilentRenewHtmlToRoot(ngAddOptions),
  ];
}

