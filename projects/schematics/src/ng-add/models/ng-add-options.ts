import { FlowType } from '../schema';

export interface ModuleInfo {
  moduleFileName: string;
  moduleName: string;
  filesFolder: string;
}

export interface StandaloneInfo {
  fileName: string;
  configName: string;
  filesFolder: string;
}

export interface NgAddOptions {
  authorityUrlOrTenantId: string;
  flowType: FlowType;
  isHttpOption: boolean;
  needsSilentRenewHtml: boolean;
  moduleInfo: ModuleInfo|undefined;
  standaloneInfo: StandaloneInfo|undefined;
  useLocalPackage: boolean;
}
