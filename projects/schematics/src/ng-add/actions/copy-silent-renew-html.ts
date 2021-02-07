import { normalize } from '@angular-devkit/core';
import { apply, chain, mergeWith, move, Rule, SchematicContext, Tree, url } from '@angular-devkit/schematics';
import { getProject } from '../../utils/angular-utils';
import { NgAddOptions } from '../models/ng-add-options';

export function copySilentRenewHtmlToRoot(options: NgAddOptions): Rule {
  return (host: Tree, context: SchematicContext) => {
    if (!options.needsSilentRenewHtml) {
      context.logger.info(`No silent-renew.html needed`);
      return host;
    }

    const project = getProject(host);
    const templateSource = apply(url(`./files/silent-renew`), [move(normalize(`${project.sourceRoot}`))]);

    return chain([mergeWith(templateSource)]);
  };
}
