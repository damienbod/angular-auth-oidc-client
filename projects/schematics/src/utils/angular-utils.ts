import { SchematicsException, Tree } from '@angular-devkit/schematics';
import { WorkspaceProject, WorkspaceSchema } from '@schematics/angular/utility/workspace-models';
import ts = require('@schematics/angular/third_party/github.com/Microsoft/TypeScript/lib/typescript');
export const ANGULAR_JSON_FILENAME = 'angular.json';

export function getAngularWorkspace(tree: Tree): WorkspaceSchema {
    const workspaceContent = getAngularJsonContent(tree);
    const workspace = JSON.parse(workspaceContent);

    return workspace as WorkspaceSchema;
}

export function updateProjectInAngularJson(tree: Tree, content: WorkspaceProject, projectName?: string) {
    projectName = projectName || getDefaultProjectName(tree);

    if (!projectName) {
        throw new SchematicsException(`project '${projectName}' could not be found and no default project is given in workspace`);
    }

    const workspaceContent = getAngularJsonContent(tree);
    const workspace = JSON.parse(workspaceContent);
    workspace['projects'][projectName] = content;
    tree.overwrite(ANGULAR_JSON_FILENAME, JSON.stringify(workspace, null, 2));
}

export function getProject(tree: Tree, projectName?: string): WorkspaceProject {
    const workspace = getAngularWorkspace(tree);
    const hasProjectName = !!projectName;
    const hasDefaultProject = !!workspace.defaultProject;

    if (hasProjectName) {
        return workspace.projects[projectName as string] || null;
    } else if (hasDefaultProject) {
        return workspace.projects[workspace.defaultProject as string];
    }

    throw new SchematicsException(`project '${projectName}' could not be found and no default project is given in workspace`);
}

export function readIntoSourceFile(host: Tree, fileName: string): ts.SourceFile {
    const buffer = host.read(fileName);
    if (buffer === null) {
        throw new SchematicsException(`File ${fileName} does not exist.`);
    }

    return ts.createSourceFile(fileName, buffer.toString('utf-8'), ts.ScriptTarget.Latest, true);
}

function getAngularJsonContent(tree: Tree) {
    const workspaceConfig = tree.read(ANGULAR_JSON_FILENAME);

    if (!workspaceConfig) {
        throw new SchematicsException('Could not find Angular workspace configuration');
    }

    return workspaceConfig.toString();
}

function getDefaultProjectName(tree: Tree) {
    const workspace = getAngularWorkspace(tree);
    return workspace.defaultProject;
}
