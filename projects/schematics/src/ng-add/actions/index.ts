import { Schema } from '../schema';
import { addPackageJsonDependencies } from './add-dependencies';
import { addModuleToImports } from './add-module-import';
import { addSilentRenewHtmlToAssetsArrayInAngularJson } from './adding-entry-to-assets';
import { copyModuleFile } from './copy-module-file';
import { copySilentRenewHtmlToRoot } from './copy-silent-renew-html';
import { installPackageJsonDependencies } from './install-dependencies';
import { parseSchema } from './schema-parser';

export function getAllActions(options: Schema) {
    const ngAddOptions = parseSchema(options);
    return [
        addPackageJsonDependencies(),
        installPackageJsonDependencies(),
        copyModuleFile(ngAddOptions),
        addModuleToImports(ngAddOptions),
        addSilentRenewHtmlToAssetsArrayInAngularJson(ngAddOptions),
        copySilentRenewHtmlToRoot(ngAddOptions),
    ];
}
