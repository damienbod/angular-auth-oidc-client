import { normalize, strings } from '@angular-devkit/core';
import { apply, chain, mergeWith, move, Rule, SchematicContext, template, Tree, url } from '@angular-devkit/schematics';
import { getProject } from '../../utils/angular-utils';
import { Schema } from '../schema';

export function copyModuleFile(options: Schema): Rule {
    return (host: Tree, context: SchematicContext) => {
        const project = getProject(host);
        const filePath = `${project.sourceRoot}/app/auth/auth-config.module.ts`;

        if (host.exists(filePath)) {
            context.logger.info(`✅️ "${filePath}" already existing - skipping file create`);
            return host;
        }

        const templateSource = apply(url('./files'), [
            template({ classify: strings.classify, dasherize: strings.dasherize, ts: 'ts', name: options.name }),
            move(normalize(`${project.sourceRoot}/app/auth`)),
        ]);

        return chain([mergeWith(templateSource)]);
    };
}
