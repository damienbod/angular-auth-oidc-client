import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import { addPackageJsonDependency, NodeDependency, NodeDependencyType } from '@schematics/angular/utility/dependencies';
import { NgAddOptions } from '../models/ng-add-options';

const dependenciesToAdd: any[] = [
  {
    name: 'angular-auth-oidc-client',
    version: '14.0.1',
  },
];

export function addPackageJsonDependencies(options: NgAddOptions): Rule {
  return (host: Tree, context: SchematicContext) => {
    const dependencies = getDependencies(options);

    for (const pack of dependencies) {
      const nodeDependency = createNodeDependency(pack);
      addPackageJsonDependency(host, nodeDependency);
      context.logger.info(`✅️ Added "${pack.name}" ${pack.version}`);
    }

    return host;
  };
}

function createNodeDependency(pack: any): NodeDependency {
  const { name, version } = pack;

  return {
    type: NodeDependencyType.Default,
    name,
    version,
    overwrite: true,
  };
}

function getDependencies(options: NgAddOptions){
  const {useLocalPackage} = options;

  if(!useLocalPackage){
    return dependenciesToAdd;
  }

  return []
}
