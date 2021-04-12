import { OpenIdConfiguration } from './openid-configuration';

export abstract class StsConfigLoader {
  abstract loadConfig(): Promise<any>;
}

export class StsConfigStaticLoader implements StsConfigLoader {
  constructor(private passedConfig: OpenIdConfiguration) {}

  loadConfig(): Promise<any> {
    return new Promise((resolve, reject) => resolve(this.passedConfig));
  }
}

export class StsConfigHttpLoader implements StsConfigLoader {
  constructor(private config$: Promise<any>) {}

  loadConfig(): Promise<any> {
    return this.config$;
  }
}
