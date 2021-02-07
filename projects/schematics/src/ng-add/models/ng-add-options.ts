import { FlowType } from '../schema';

export interface ModuleInfo {
  moduleFileName: string;
  moduleName: string;
  moduleFolder: string;
}

export interface NgAddOptions {
  stsUrlOrTenantId: string;
  flowType: FlowType;
  isHttpOption: boolean;
  needsSilentRenewHtml: boolean;
  moduleInfo: ModuleInfo;
}
