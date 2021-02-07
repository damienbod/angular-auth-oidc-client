import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import { NodePackageInstallTask } from '@angular-devkit/schematics/tasks';

export function installPackageJsonDependencies(): Rule {
  return (host: Tree, context: SchematicContext) => {
    context.logger.info(`🔍 Installing packages...`);
    context.addTask(new NodePackageInstallTask());
    context.logger.info(`✅️ Installed`);

    return host;
  };
}
