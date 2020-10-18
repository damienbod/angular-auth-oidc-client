import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import { addImportToModule } from '@schematics/angular/utility/ast-utils';
import { InsertChange } from '@schematics/angular/utility/change';
import { getProject, readIntoSourceFile } from '../../utils/angular-utils';

export function addModuleToImports(options: any): Rule {
    return (host: Tree, context: SchematicContext) => {
        const project = getProject(host, options?.project);
        const filePath = `${project.sourceRoot}/app/app.module.ts`;
        const moduleName = 'AuthenticationModule';

        const modulePath = `./auth/auth.module`;
        const sourcefile = readIntoSourceFile(host, filePath);
        const importChanges = addImportToModule(sourcefile, modulePath, 'AuthenticationModule', modulePath) as InsertChange[];

        importChanges.forEach((insertChange) => {
            const exportRecorder = host.beginUpdate(filePath);
            exportRecorder.insertLeft(insertChange.pos, insertChange.toAdd);
            host.commitUpdate(exportRecorder);
        });

        context.logger.info(`✅️ '${moduleName}' is imported in '${filePath}'`);
        return host;
    };
}
