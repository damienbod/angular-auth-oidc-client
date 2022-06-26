import { Rule, SchematicContext, SchematicsException, Tree } from '@angular-devkit/schematics';
import { getAngularWorkspace, getProject } from '../../utils/angular-utils';

export function runChecks(): Rule {
  return (host: Tree, context: SchematicContext) => {

    const projectName = getProject(host);
    const workspace = getAngularWorkspace(host);

    if(!projectName){
      throw new SchematicsException(`Checks failed. Could not get project.
        No default project given in the workspace - ${JSON.stringify(workspace, null, 2)}`);
    }

    context.logger.info(`✅️ Project found, working with '${projectName}'`);

    return host;
  };
}
