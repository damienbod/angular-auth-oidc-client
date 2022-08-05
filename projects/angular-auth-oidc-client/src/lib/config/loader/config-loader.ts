import { Provider } from '@angular/core';
import { Observable, of } from 'rxjs';
import { OpenIdConfiguration } from '../openid-configuration';

export class OpenIdConfigLoader {
  loader?: Provider;
}

export abstract class StsConfigLoader {
  abstract loadConfigs(): Observable<OpenIdConfiguration>[];
}

export class StsConfigStaticLoader implements StsConfigLoader {
  constructor(private passedConfigs: OpenIdConfiguration | OpenIdConfiguration[]) {}

  loadConfigs(): Observable<OpenIdConfiguration>[] {
    if (Array.isArray(this.passedConfigs)) {
      return this.passedConfigs.map((x) => of(x));
    }

    const singleStaticConfig$ = of(this.passedConfigs);

    return [singleStaticConfig$];
  }
}

export class StsConfigHttpLoader implements StsConfigLoader {
  constructor(private configs$: Observable<OpenIdConfiguration> | Observable<OpenIdConfiguration>[]) {}

  loadConfigs(): Observable<OpenIdConfiguration>[] {
    if (Array.isArray(this.configs$)) {
      return this.configs$;
    }

    return [this.configs$];
  }
}
