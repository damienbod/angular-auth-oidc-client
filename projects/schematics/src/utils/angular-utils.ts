import { SchematicsException, Tree } from '@angular-devkit/schematics';
import { WorkspaceProject } from '@schematics/angular/utility/workspace-models';
import { FlowType } from '../ng-add/schema';
import ts = require('@schematics/angular/third_party/github.com/Microsoft/TypeScript/lib/typescript');
export const ANGULAR_JSON_FILENAME = 'angular.json';
const AUTH_CONFIG_MODULE = { moduleFileName: 'auth-config.module', moduleName: 'AuthConfigModule', moduleFolder: 'auth-config' };
const AUTH_HTTP_CONFIG_MODULE = {
    moduleFileName: 'auth-http-config.module',
    moduleName: 'AuthHttpConfigModule',
    moduleFolder: 'auth-http-config',
};

export function getAngularWorkspace(tree: Tree) {
    const workspaceConfig = tree.read(ANGULAR_JSON_FILENAME);

    if (!workspaceConfig) {
        throw new SchematicsException('Could not find Angular workspace configuration');
    }

    const workspaceContent = workspaceConfig.toString();
    const workspace = JSON.parse(workspaceContent);

    return workspace;
}

export function getProject(tree: Tree, projectName?: string) {
    const workspace = getAngularWorkspace(tree);
    const project = !!projectName ? workspace.projects[projectName] : workspace.defaultProject;
    return workspace.projects[project] as WorkspaceProject;
}

export function readIntoSourceFile(host: Tree, fileName: string): ts.SourceFile {
    const buffer = host.read(fileName);
    if (buffer === null) {
        throw new SchematicsException(`File ${fileName} does not exist.`);
    }

    return ts.createSourceFile(fileName, buffer.toString('utf-8'), ts.ScriptTarget.Latest, true);
}

export function needsHttp(flowType: FlowType) {
    return flowType === FlowType.OidcCodeFlowPkceUsingIframeSilentRenewGettingConfigFromHttp;
}

export function getModuleInfo(flowType: FlowType) {
    if (needsHttp(flowType)) {
        return AUTH_HTTP_CONFIG_MODULE;
    }

    return AUTH_CONFIG_MODULE;
}
