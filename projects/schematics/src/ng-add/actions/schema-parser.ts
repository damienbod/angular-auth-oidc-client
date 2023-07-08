import { Tree } from '@angular-devkit/schematics';
import { isStandaloneSchematic } from '../../utils/angular-utils';
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

export async function parseSchema(host: Tree, options: Schema): Promise<NgAddOptions> {
  const { flowType } = options;
  const isStandalone = await isStandaloneSchematic(host, options);

  return {
    ...options,
    moduleInfo: isStandalone ? undefined : getModuleInfo(flowType),
    standaloneInfo: isStandalone ? getStandaloneInfo(flowType) : undefined,
    isHttpOption: needsHttp(flowType),
    needsSilentRenewHtml: needsSilentRenewHtml(flowType),
  };
}
