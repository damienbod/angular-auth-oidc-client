import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import { addPackageJsonDependency, NodeDependency, NodeDependencyType } from '@schematics/angular/utility/dependencies';

const dependenciesToAdd = [
  {
    name: 'angular-auth-oidc-client',
    version: '11.6.9',
  },
];

export function addPackageJsonDependencies(): Rule {
  return (host: Tree, context: SchematicContext) => {
    for (const pack of dependenciesToAdd) {
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
