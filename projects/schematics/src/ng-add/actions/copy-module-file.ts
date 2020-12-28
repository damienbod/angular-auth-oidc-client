import { normalize } from '@angular-devkit/core';
import { apply, applyTemplates, chain, mergeWith, move, Rule, SchematicContext, Tree, url } from '@angular-devkit/schematics';
import { getProject } from '../../utils/angular-utils';

export function copyModuleFile(options: any): Rule {
    return (host: Tree, context: SchematicContext) => {
        const project = getProject(host, options?.project);
        const filePath = `${project.sourceRoot}/app/auth/auth-config.module.ts`;

        if (host.exists(filePath)) {
            context.logger.info(`✅️ "${filePath}" already existing - skipping file create`);
            return host;
        }

        const templateSource = apply(url('./files'), [applyTemplates({}), move(normalize(`${project.sourceRoot}/app/auth`))]);

        return chain([mergeWith(templateSource)]);
    };
}
