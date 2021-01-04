import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import { addImportToModule } from '@schematics/angular/utility/ast-utils';
import { InsertChange } from '@schematics/angular/utility/change';
import { getProject, readIntoSourceFile } from '../../utils/angular-utils';
import { NgAddOptions } from '../models/ng-add-options';

export function addModuleToImports(options: NgAddOptions): Rule {
    return (host: Tree, context: SchematicContext) => {
        const project = getProject(host);

        const { moduleFileName, moduleName } = options.moduleInfo;

        const modulesToImport = [
            {
                target: `${project.sourceRoot}/app/app.module.ts`,
                moduleName,
                modulePath: `./auth/${moduleFileName}`,
            },
        ];

        modulesToImport.forEach(({ target, moduleName, modulePath }) => {
            addImport(host, context, moduleName, modulePath, target);
        });

        context.logger.info(`All imports done, please add the 'RouterModule' as well if you don't have it imported yet.`);

        return host;
    };
}

function addImport(host: Tree, context: SchematicContext, moduleName: string, source: string, target: string) {
    const sourcefile = readIntoSourceFile(host, target);
    const importChanges = addImportToModule(sourcefile, source, moduleName, source) as InsertChange[];

    importChanges.forEach((insertChange) => {
        const exportRecorder = host.beginUpdate(target);
        exportRecorder.insertLeft(insertChange.pos, insertChange.toAdd);
        host.commitUpdate(exportRecorder);
    });

    context.logger.info(`✅️ '${moduleName}' is imported in '${target}'`);
}
