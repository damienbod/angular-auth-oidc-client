export interface UserDataResult {
  userData: any;
  allUserData: ConfigUserDataResult[];
}

export interface ConfigUserDataResult {
  configId: string;
  userData: any;
}
