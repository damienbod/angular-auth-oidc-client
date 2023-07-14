import { JsonValue, Path } from '@angular-devkit/core';
import { SchematicsException, Tree } from '@angular-devkit/schematics';
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

// TODO: replace with the following when NG 15 supprt is dropped 
// import { isStandaloneApp } from '@schematics/angular/utility/ng-ast-utils';
function isStandaloneApp(host: Tree, mainPath: string): boolean {
  const source = ts.createSourceFile(
    mainPath,
    host.readText(mainPath),
    ts.ScriptTarget.Latest,
    true,
  );
  const bootstrapCall = findBootstrapApplicationCall(source);

  return bootstrapCall !== null;
}

function findBootstrapApplicationCall(sourceFile: ts.SourceFile): ts.CallExpression | null {
  const localName = findImportLocalName(
    sourceFile,
    'bootstrapApplication',
    '@angular/platform-browser',
  );

  if (!localName) {
    return null;
  }

  let result: ts.CallExpression | null = null;

  sourceFile.forEachChild(function walk(node) {
    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === localName
    ) {
      result = node;
    }

    if (!result) {
      node.forEachChild(walk);
    }
  });

  return result;
}

function findImportLocalName(
  sourceFile: ts.SourceFile,
  name: string,
  moduleName: string,
): string | null {
  for (const node of sourceFile.statements) {
    // Only look for top-level imports.
    if (
      !ts.isImportDeclaration(node) ||
      !ts.isStringLiteral(node.moduleSpecifier) ||
      node.moduleSpecifier.text !== moduleName
    ) {
      continue;
    }

    // Filter out imports that don't have the right shape.
    if (
      !node.importClause ||
      !node.importClause.namedBindings ||
      !ts.isNamedImports(node.importClause.namedBindings)
    ) {
      continue;
    }

    // Look through the elements of the declaration for the specific import.
    for (const element of node.importClause.namedBindings.elements) {
      if ((element.propertyName || element.name).text === name) {
        // The local name is always in `name`.
        return element.name.text;
      }
    }
  }

  return null;
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
