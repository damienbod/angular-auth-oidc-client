import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import {
  addFunctionalProvidersToStandaloneBootstrap,
  callsProvidersFunction,
} from '@schematics/angular/private/standalone';
import { insertImport } from '@schematics/angular/utility/ast-utils';
import { InsertChange } from '@schematics/angular/utility/change';
import * as ts from 'typescript';
import { getProject, readIntoSourceFile } from '../../utils/angular-utils';
import { NgAddOptions } from '../models/ng-add-options';

export function addStandaloneConfigsToProviders(options: NgAddOptions): Rule {
  return (host: Tree, context: SchematicContext) => {
    const project = getProject(host);

    const { fileName, configName } = options.standaloneInfo!;

    const standaloneConfigs = [
      {
        target: `${project.sourceRoot}/main.ts`,
        configName,
        configPath: `./auth/${fileName}`,
      },
    ];

    standaloneConfigs.forEach(({ target, configName, configPath }) => {
      addProvider(host, context, configName, configPath, target);
    });

    context.logger.info(`✅️ All imports done, please add the 'provideRouter()' as well if you don't have it provided yet.`);

    return host;
  };
}

function addProvider(host: Tree, context: SchematicContext, configName: string, configPath: string, target: string) {
  const sourcefile = readIntoSourceFile(host, target);
  const providerFn = 'provideAuth';
  if (callsProvidersFunction(host, sourcefile.fileName, providerFn)) {
    // exit because the store config is already provided
    return host;
  }

  const patchedConfigFile = addFunctionalProvidersToStandaloneBootstrap(
    host,
    sourcefile.fileName,
    providerFn,
    'angular-auth-oidc-client',
    [ts.factory.createIdentifier('authConfig')]
  );

  const configFileContent = host.read(patchedConfigFile);
  const source = ts.createSourceFile(
    patchedConfigFile,
    configFileContent?.toString('utf-8') || '',
    ts.ScriptTarget.Latest,
    true
  );


  const change = insertImport(
    source as any, // Angular uses the TS 5.1 compiler internally for schematics?
    patchedConfigFile,
    configName,
    configPath
  );

  const recorder = host.beginUpdate(patchedConfigFile);

  if (change instanceof InsertChange) {
    recorder.insertLeft(change.pos, change.toAdd);
  }

  host.commitUpdate(recorder);

  return host;

}
