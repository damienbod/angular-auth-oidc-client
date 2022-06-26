import { Rule, SchematicContext, SchematicsException, Tree } from '@angular-devkit/schematics';
import { getAngularJsonContent, getDefaultProjectName } from '../../utils/angular-utils';

export function runChecks(): Rule {
  return (host: Tree, context: SchematicContext) => {
    const projectName = getDefaultProjectName(host);

    context.logger.info(`🔎 Running checks...`);

    if(!projectName){
      const angularJsonContent = getAngularJsonContent(host);

      throw new SchematicsException(`Checks failed. Could not get project.
        No default project given in the workspace - ${JSON.stringify(angularJsonContent, null, 2)}`);
    }

    context.logger.info(`✅️ Project found, working with '${projectName}'`);

    return host;
  };
}

