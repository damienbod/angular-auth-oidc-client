import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import { getProject, updateProjectInAngularJson } from '../../utils/angular-utils';
import { NgAddOptions } from '../models/ng-add-options';

export function addSilentRenewHtmlToAssetsArrayInAngularJson(ngAddOptions: NgAddOptions): Rule {
  return (host: Tree, context: SchematicContext) => {
    if (!ngAddOptions.needsSilentRenewHtml) {
      context.logger.info(`No silent-renew entry in assets array needed`);
      return host;
    }

    const project = getProject(host);

    const options = project.architect?.build?.options;
    const srcRoot = project.sourceRoot;
    options?.assets?.push(`${srcRoot}/silent-renew.html`);

    updateProjectInAngularJson(host, project);

    return host;
  };
}
