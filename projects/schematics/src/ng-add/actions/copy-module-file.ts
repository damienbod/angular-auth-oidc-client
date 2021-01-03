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
    url,
} from '@angular-devkit/schematics';
import { getModuleInfo, getProject, needsHttp } from '../../utils/angular-utils';
import { FlowType, Schema } from '../schema';
import { AZURE_AD_REFRESH_TOKENS, AZURE_AD_SILENT_RENEW, DEFAULT_CONFIG, IFRAME_SILENT_RENEW } from './configs';

export function copyModuleFile(options: Schema): Rule {
    return (host: Tree, context: SchematicContext) => {
        const project = getProject(host);

        const { flowType } = options;
        const { moduleFileName, moduleFolder } = getModuleInfo(flowType);

        const filePath = `${project.sourceRoot}/app/auth/${moduleFileName}.ts`;
        if (host.exists(filePath)) {
            context.logger.info(`✅️ "${filePath}" already existing - skipping file create`);
            return host;
        }

        const templateConfig = getTemplateConfig(options);

        context.logger.info(`✅️ "${filePath}" will be created`);

        const templateSource = apply(url(`./files/${moduleFolder}`), [
            template(templateConfig),
            move(normalize(`${project.sourceRoot}/app/auth`)),
        ]);

        return chain([mergeWith(templateSource)]);
    };
}

function getTemplateConfig(options: Schema) {
    const { stsUrlOrTenantId, flowType } = options;

    if (needsHttp(flowType)) {
        return { ts: 'ts', stsUrlOrTenantId };
    }

    const authConfig = getConfig(flowType, stsUrlOrTenantId);

    return { ts: 'ts', authConfig };
}

function getConfig(flowType: FlowType, stsUrlOrTenantId: string) {
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

        case FlowType.OidcCodeFlowPkceUsingIframeSilentRenew: {
            config = IFRAME_SILENT_RENEW;
            break;
        }

        case FlowType.OidcCodeFlowPkceUsingIframeSilentRenewGettingConfigFromHttp: {
            throw new SchematicsException(`With HTTP another module is used. No config but another module`);
        }

        case FlowType.OidcCodeFlowPkceUsingRefreshTokens: {
            config = DEFAULT_CONFIG;
            break;
        }

        default: {
            throw new SchematicsException(`Could not parse flowType '${flowType}'`);
        }
    }

    return config.replace('<stsUrlOrTenantId>', stsUrlOrTenantId);
}
