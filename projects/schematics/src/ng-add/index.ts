import { normalize } from '@angular-devkit/core';
import { apply, applyTemplates, chain, mergeWith, move, noop, Rule, SchematicContext, Tree, url } from '@angular-devkit/schematics';
import { NodePackageInstallTask } from '@angular-devkit/schematics/tasks';
import {
    addModuleImportToRootModule,
    addPackageJsonDependency,
    getProjectFromWorkspace,
    getWorkspace,
    NodeDependency,
    NodeDependencyType,
    ProjectType,
    WorkspaceProject,
} from 'schematics-utilities';

export function ngAdd(options: any): Rule {
    return chain([
        options && options.skipPackageJson ? noop() : addPackageJsonDependencies(),
        options && options.skipPackageJson ? noop() : installPackageJsonDependencies(),
        options && options.skipModuleImport ? noop() : addModuleToImports(options),
        options && options.skipModuleImport ? noop() : copyModuleFile(options),
    ]);
}

function addPackageJsonDependencies(): Rule {
    return (host: Tree, context: SchematicContext) => {
        const dependencies: NodeDependency[] = [{ type: NodeDependencyType.Default, version: '11.2.0', name: 'angular-auth-oidc-client' }];

        dependencies.forEach((dependency) => {
            addPackageJsonDependency(host, dependency);
            context.logger.log('info', `✅️ Added "${dependency.name}" into ${dependency.type}`);
        });

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
        const workspace = getWorkspace(host);
        const project = getProjectFromWorkspace(workspace, options.project ? options.project : workspace.defaultProject);
        const moduleName = 'AuthenticationModule';

        addModuleImportToRootModule(host, moduleName, './auth/auth.module', project as WorkspaceProject<ProjectType.Application>);
        context.logger.log('info', `✅️ "${moduleName}" is imported`);

        return host;
    };
}

function copyModuleFile(options: any): Rule {
    return (host: Tree) => {
        const workspace = getWorkspace(host);
        const project = getProjectFromWorkspace(workspace, options.project ? options.project : workspace.defaultProject);

        const templateSource = apply(url('./files'), [applyTemplates({}), move(normalize(`${project.sourceRoot}/app/auth`))]);

        return chain([mergeWith(templateSource)]);
    };
}
