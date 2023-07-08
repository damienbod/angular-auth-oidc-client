import { JsonValue, Path } from '@angular-devkit/core';
import { SchematicsException, Tree } from '@angular-devkit/schematics';
import { isStandaloneApp } from '@schematics/angular/utility/ng-ast-utils';
import { ProjectDefinition, WorkspaceDefinition, getWorkspace } from '@schematics/angular/utility/workspace';
import { WorkspaceProject, WorkspaceSchema } from '@schematics/angular/utility/workspace-models';
import { Schema } from '../ng-add/schema';
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
    throw new SchematicsException(`Could not Update Project in Angular.json because no project name was found.`);
  }

  const workspaceContent = getAngularJsonContent(tree);
  const workspace = JSON.parse(workspaceContent);
  workspace['projects'][projectName] = content;
  tree.overwrite(ANGULAR_JSON_FILENAME, JSON.stringify(workspace, null, 2));
}

export function getProject(tree: Tree, projectName?: string): WorkspaceProject {
  const workspace = getAngularWorkspace(tree);
  const defaultProject = getDefaultProjectName(tree);

  if (!!projectName) {
    return workspace.projects[projectName as string] || null;
  } else if (!!defaultProject) {
    return workspace.projects[defaultProject as string];
  }

  throw new SchematicsException(`Could not get project. Searched for '${projectName}',
        but it could not be found and no default project is given in workspace - ${JSON.stringify(workspace.projects, null, 2)}`);
}

export function readIntoSourceFile(host: Tree, fileName: string): ts.SourceFile {
  const buffer = host.read(fileName);
  if (buffer === null) {
    throw new SchematicsException(`File ${fileName} does not exist.`);
  }

  return ts.createSourceFile(fileName, buffer.toString('utf-8'), ts.ScriptTarget.Latest, true);
}

export function getDefaultProjectName(tree: Tree) {
  const workspace = getAngularWorkspace(tree);
  const allProjects = Object.keys(workspace.projects);

  return allProjects[0];
}

export function getAngularJsonContent(tree: Tree) {
  const workspaceConfig = tree.read(ANGULAR_JSON_FILENAME);

  if (!workspaceConfig) {
    throw new SchematicsException('Could not find Angular workspace configuration');
  }

  return workspaceConfig.toString();
}



// Taken from https://github.com/angular/components/blob/5f5c5160dc20331619fc6729aa2ad78ac84af1c3/src/cdk/schematics/utils/schematic-options.ts#L46
export async function isStandaloneSchematic(host: Tree, options: Schema): Promise<boolean> {
  const workspace = await getWorkspace(host);
  const project = getProjectFromWorkspace(workspace, getDefaultProjectName(host))

  // not on an Angular version that supports standalone either.
  if (!project.targets?.has('build')) {
    return false;
  }

  return isStandaloneApp(host, getProjectMainFile(project));
}

function getProjectFromWorkspace(
  workspace: WorkspaceDefinition,
  projectName: string | undefined,
): ProjectDefinition {
  if (!projectName) {
    throw new SchematicsException('Project name is required.');
  }

  const project = workspace.projects.get(projectName);

  if (!project) {
    throw new SchematicsException(`Could not find project in workspace: ${projectName}`);
  }

  return project;
}

function getProjectMainFile(project: ProjectDefinition): Path {
  const buildOptions = getProjectTargetOptions(project, 'build');

  if (!buildOptions.main) {
    throw new SchematicsException(
      `Could not find the project main file inside of the ` +
        `workspace config (${project.sourceRoot})`,
    );
  }

  return buildOptions.main as Path;
}

function getProjectTargetOptions(
  project: ProjectDefinition,
  buildTarget: string,
): Record<string, JsonValue | undefined> {
  const options = project.targets?.get(buildTarget)?.options;

  if (!options) {
    throw new SchematicsException(
      `Cannot determine project target configuration for: ${buildTarget}.`,
    );
  }

  return options;
}
