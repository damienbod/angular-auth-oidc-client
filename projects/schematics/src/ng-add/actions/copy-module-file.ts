import { normalize } from '@angular-devkit/core';
import {
  apply,
  chain,
  mergeWith,
  move,
  Rule,
  SchematicContext,
  SchematicsException,
  template,
  Tree,
  url
} from '@angular-devkit/schematics';
import { getProject } from '../../utils/angular-utils';
import { NgAddOptions } from '../models/ng-add-options';
import { FlowType } from '../schema';
import { AUTH_0, AZURE_AD_REFRESH_TOKENS, AZURE_AD_SILENT_RENEW, DEFAULT_CONFIG, IFRAME_SILENT_RENEW, OAUTH_PAR, OIDC_PLAIN } from './configs';

export function copyModuleFile(options: NgAddOptions): Rule {
  return (host: Tree, context: SchematicContext) => {
    const project = getProject(host);

    const { moduleFileName, moduleFolder } = options.moduleInfo;

    const filePath = `${project.sourceRoot}/app/auth/${moduleFileName}.ts`;
    if (host.exists(filePath)) {
      context.logger.info(`✅️ '${filePath}'' already existing - skipping file create`);
      return host;
    }

    const templateConfig = getTemplateConfig(options);

    context.logger.info(`✅️ '${filePath}''will be created`);

    const templateSource = apply(url(`./files/${moduleFolder}`), [
      template(templateConfig),
      move(normalize(`${project.sourceRoot}/app/auth`)),
    ]);

    return chain([mergeWith(templateSource)]);
  };
}

function getTemplateConfig(options: NgAddOptions) {
  const { authorityUrlOrTenantId, flowType } = options;

  if (options.isHttpOption) {
    return { ts: 'ts', authorityUrlOrTenantId };
  }

  const authConfig = getConfig(flowType, authorityUrlOrTenantId);

  return { ts: 'ts', authConfig };
}

function getConfig(flowType: FlowType, authorityUrlOrTenantId: string) {
  let config = DEFAULT_CONFIG;

  switch (flowType) {
    case FlowType.OidcCodeFlowPkceAzureAdUsingIframeSilentRenew: {
      config = AZURE_AD_SILENT_RENEW;
      break;
    }

    case FlowType.OidcCodeFlowPkceAzureAdUsingRefreshTokens: {
      config = AZURE_AD_REFRESH_TOKENS;
      break;
    }

     case FlowType.OAuthPushAuthorizationRequestsUsingRefreshTokens: {
      config = OAUTH_PAR;
      break;
    }

    case FlowType.OidcCodeFlowPkceUsingIframeSilentRenew: {
      config = IFRAME_SILENT_RENEW;
      break;
    }

    case FlowType.OidcCodeFlowPkceUsingIframeSilentRenewGettingConfigFromHttp: {
      throw new SchematicsException(`With HTTP another module is used. No config but another module`);
    }

    case FlowType.OIDCCodeFlowPkce: {
      config = OIDC_PLAIN;
      break;
    }

    case FlowType.Auth0: {
      config = AUTH_0;
      break;
    }

    case FlowType.OidcCodeFlowPkceUsingRefreshTokens:
    case FlowType.DefaultConfig: {
      config = DEFAULT_CONFIG;
      break;
    }

    default: {
      throw new SchematicsException(`Could not parse flowType '${flowType}'`);
    }
  }

  return config.replace('<authorityUrlOrTenantId>', authorityUrlOrTenantId);
}
