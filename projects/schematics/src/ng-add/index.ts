import { normalize } from '@angular-devkit/core';
import { apply, applyTemplates, chain, mergeWith, move, Rule, SchematicContext, Tree, url } from '@angular-devkit/schematics';
import { NodePackageInstallTask } from '@angular-devkit/schematics/tasks';
import { addImportToModule } from '@schematics/angular/utility/ast-utils';
import { InsertChange } from '@schematics/angular/utility/change';
import { addPackageJsonDependency, NodeDependency, NodeDependencyType } from '@schematics/angular/utility/dependencies';
import { getProject, readIntoSourceFile } from '../utils/angular-utils';

const dependenciesToAdd = [
    {
        name: 'angular-auth-oidc-client',
        version: '11.2.0',
    },
];

export function ngAdd(options: any): Rule {
    return chain([addPackageJsonDependencies(), installPackageJsonDependencies(), copyModuleFile(options), addModuleToImports(options)]);
}

function createNodeDependency(pack: any): NodeDependency {
    const { name, version } = pack;

    return {
        type: NodeDependencyType.Dev,
        name,
        version,
        overwrite: true,
    };
}

function addPackageJsonDependencies(): Rule {
    return (host: Tree, context: SchematicContext) => {
        for (const pack of dependenciesToAdd) {
            const nodeDependency = createNodeDependency(pack);
            addPackageJsonDependency(host, nodeDependency);
            context.logger.log('info', `✅️ Added "${pack.name}" ${pack.version}`);
        }

        return host;
    };
}

function installPackageJsonDependencies(): Rule {
    return (host: Tree, context: SchematicContext) => {
        context.addTask(new NodePackageInstallTask());
        context.logger.log('info', `🔍 Installing packages...`);

        return host;
    };
}

function addModuleToImports(options: any): Rule {
    return (host: Tree, context: SchematicContext) => {
        const project = getProject(host, options?.project);
        const moduleName = 'AuthenticationModule';

        const filePath = `${project.sourceRoot}/app/app.module.ts`;
        const modulePath = `./auth/auth.module`;
        // const importStatement = `import { AuthenticationModule } from '${modulePath}';\n`;
        // const insertChange = new InsertChange(filePath, 0, importStatement);
        // const exportRecorder = host.beginUpdate(filePath);
        // exportRecorder.insertLeft(insertChange.pos, insertChange.toAdd);
        // host.commitUpdate(exportRecorder);

        const sourcefile = readIntoSourceFile(host, filePath);

        const importChanges = addImportToModule(sourcefile, modulePath, 'AuthenticationModule', modulePath) as InsertChange[];

        importChanges.forEach((insertChange) => {
            const exportRecorder = host.beginUpdate(filePath);
            exportRecorder.insertLeft(insertChange.pos, insertChange.toAdd);
            host.commitUpdate(exportRecorder);
        });

        context.logger.log('info', `✅️ "${moduleName}" is imported`);
        return host;
    };
}

function copyModuleFile(options: any): Rule {
    return (host: Tree) => {
        const project = getProject(host, options?.project);

        const templateSource = apply(url('./files'), [applyTemplates({}), move(normalize(`${project.sourceRoot}/app/auth`))]);

        return chain([mergeWith(templateSource)]);
    };
}
