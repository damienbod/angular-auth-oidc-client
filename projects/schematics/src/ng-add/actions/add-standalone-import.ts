import { Rule, SchematicContext, Tree, chain } from '@angular-devkit/schematics';
import { addRootProvider } from '@schematics/angular/utility';
import { getProject } from '../../utils/angular-utils';
import { NgAddOptions } from '../models/ng-add-options';

export function addStandaloneConfigsToProviders(options: NgAddOptions): Rule {
  return (host: Tree, context: SchematicContext) => {
    const [projectName] = getProject(host);
    const { fileName } = options.standaloneInfo!;
    
    context.logger.info(`✅️ All imports done, please add the 'provideRouter()' as well if you don't have it provided yet.`);

    return chain([
      addRootProvider(projectName, ({code, external}) => {
        external('authConfig', `./auth/${fileName}`);
        return code`${external('provideAuth', 'angular-auth-oidc-client')}(authConfig)`;
      }),
    ]);
  };
}
