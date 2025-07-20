import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import { addImportToModule } from '@schematics/angular/utility/ast-utils';
import { InsertChange } from '@schematics/angular/utility/change';
import { getProject, readIntoSourceFile } from '../../utils/angular-utils';
import { NgAddOptions } from '../models/ng-add-options';

export function addModuleToImports(options: NgAddOptions): Rule {
  return (host: Tree, context: SchematicContext) => {
    const [,project] = getProject(host);

    const { moduleFileName, moduleName } = options.moduleInfo!;

    // Try to find the app module file with different naming conventions
    const appModulePath = findAppModulePath(host, project.sourceRoot);
    
    if (!appModulePath) {
      throw new Error(
        'Could not find app module file. Tried: app.module.ts, app-module.ts. ' +
        'Please ensure your app module exists in the src/app directory.'
      );
    }

    const modulesToImport = [
      {
        target: appModulePath,
        moduleName,
        modulePath: `./auth/${moduleFileName}`,
      },
    ];

    modulesToImport.forEach(({ target, moduleName, modulePath }) => {
      addImport(host, context, moduleName, modulePath, target);
    });

    context.logger.info(`✅️ All imports done, please add the 'RouterModule' as well if you don't have it imported yet.`);

    return host;
  };
}

function findAppModulePath(host: Tree, sourceRoot: string): string | null {
  // Try common naming conventions for app module
  const possiblePaths = [
    `${sourceRoot}/app/app.module.ts`,     // Traditional Angular CLI naming
    `${sourceRoot}/app/app-module.ts`,     // Newer Angular CLI naming convention
  ];
  
  for (const path of possiblePaths) {
    if (host.exists(path)) {
      return path;
    }
  }
  
  return null;
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
