import { SchematicsException, Tree } from '@angular-devkit/schematics';
import { getProject, isStandaloneSchematic } from '../../utils/angular-utils';
import { findAppModulePath } from './add-module-import';
import { ModuleInfo, NgAddOptions, StandaloneInfo } from '../models/ng-add-options';
import { FlowType, Schema } from '../schema';

const AUTH_CONFIG_MODULE: ModuleInfo = { 
  moduleFileName: 'auth-config.module', 
  moduleName: 'AuthConfigModule', 
  filesFolder: 'auth-config-module' 
};
const AUTH_HTTP_CONFIG_MODULE: ModuleInfo = {
  moduleFileName: 'auth-http-config.module',
  moduleName: 'AuthHttpConfigModule',
  filesFolder: 'auth-http-config-module',
};

const AUTH_CONFIG_STANDALONE: StandaloneInfo = { 
  fileName: 'auth.config',
  configName: 'authConfig', 
  filesFolder: 'auth-config-standalone' 
};
const AUTH_HTTP_CONFIG_STANDALONE: StandaloneInfo = {
  fileName: 'auth-http.config',
  configName: 'authHttpConfig',
  filesFolder: 'auth-http-config-standalone',
};

function needsHttp(flowType: FlowType) {
  return flowType === FlowType.OidcCodeFlowPkceUsingIframeSilentRenewGettingConfigFromHttp;
}

function needsSilentRenewHtml(flowType: FlowType) {
  const optionsWithSilentRenewHtml = [
    FlowType.OidcCodeFlowPkceUsingIframeSilentRenewGettingConfigFromHttp,
    FlowType.OidcCodeFlowPkceAzureAdUsingIframeSilentRenew,
    FlowType.OidcCodeFlowPkceUsingIframeSilentRenew,
  ];

  return optionsWithSilentRenewHtml.includes(flowType);
}

function getModuleInfo(flowType: FlowType):ModuleInfo {
  if (needsHttp(flowType)) {
    return AUTH_HTTP_CONFIG_MODULE;
  }

  return AUTH_CONFIG_MODULE;
}

function getStandaloneInfo(flowType: FlowType):StandaloneInfo {
  if (needsHttp(flowType)) {
    return AUTH_HTTP_CONFIG_STANDALONE;
  }

  return AUTH_CONFIG_STANDALONE;
}

async function useStandaloneSetup(host: Tree, options: Schema): Promise<boolean> {
  const { standalone, legacyModules } = options;

  if (standalone && legacyModules) {
    throw new SchematicsException(`The options '--standalone' and '--legacy-modules' cannot be used together.`);
  }

  if (legacyModules) {
    const [, project] = getProject(host);

    if (!findAppModulePath(host, project.sourceRoot)) {
      throw new SchematicsException(
        `The option '--legacy-modules' requires an NgModule based application, but no 'app.module.ts' or 'app-module.ts' was found. ` +
          `Use '--standalone' instead.`
      );
    }

    return false;
  }

  if (standalone) {
    return true;
  }

  // Neither option given: detect the setup from how the application is bootstrapped.
  return isStandaloneSchematic(host, options);
}

export async function parseSchema(host: Tree, options: Schema): Promise<NgAddOptions> {
  const { flowType } = options;
  const isStandalone = await useStandaloneSetup(host, options);

  return {
    ...options,
    moduleInfo: isStandalone ? undefined : getModuleInfo(flowType),
    standaloneInfo: isStandalone ? getStandaloneInfo(flowType) : undefined,
    isHttpOption: needsHttp(flowType),
    needsSilentRenewHtml: needsSilentRenewHtml(flowType),
  };
}
