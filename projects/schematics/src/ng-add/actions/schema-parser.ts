import { NgAddOptions } from '../models/ng-add-options';
import { FlowType, Schema } from '../schema';

const AUTH_CONFIG_MODULE = { moduleFileName: 'auth-config.module', moduleName: 'AuthConfigModule', moduleFolder: 'auth-config' };
const AUTH_HTTP_CONFIG_MODULE = {
    moduleFileName: 'auth-http-config.module',
    moduleName: 'AuthHttpConfigModule',
    moduleFolder: 'auth-http-config',
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

function getModuleInfo(flowType: FlowType) {
    if (needsHttp(flowType)) {
        return AUTH_HTTP_CONFIG_MODULE;
    }

    return AUTH_CONFIG_MODULE;
}

export function parseSchema(options: Schema): NgAddOptions {
    const { flowType } = options;
    return {
        ...options,
        moduleInfo: getModuleInfo(flowType),
        isHttpOption: needsHttp(flowType),
        needsSilentRenewHtml: needsSilentRenewHtml(flowType),
    };
}
