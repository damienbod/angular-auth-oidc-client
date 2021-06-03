import { Provider } from '@angular/core';
import { OpenIdConfiguration } from '../openid-configuration';

export class OpenIdConfigLoader {
  loader?: Provider;
}

export abstract class StsConfigLoader {
  abstract loadConfigs(): Promise<OpenIdConfiguration>[];
}

export class StsConfigStaticLoader implements StsConfigLoader {
  constructor(private passedConfigs: OpenIdConfiguration | OpenIdConfiguration[]) {}

  loadConfigs(): Promise<OpenIdConfiguration>[] {
    if (Array.isArray(this.passedConfigs)) {
      const allInstantStaticPromises = this.passedConfigs.map((x) => new Promise((resolve, _) => resolve(x)));

      return allInstantStaticPromises;
    }

    const singleStaticPromise = new Promise((resolve, _) => resolve(this.passedConfigs));

    return [singleStaticPromise];
  }
}

export class StsConfigHttpLoader implements StsConfigLoader {
  constructor(private configs$: Promise<OpenIdConfiguration> | Promise<OpenIdConfiguration>[]) {}

  loadConfigs(): Promise<OpenIdConfiguration>[] {
    return Array.isArray(this.configs$) ? this.configs$ : [this.configs$];
  }
}
