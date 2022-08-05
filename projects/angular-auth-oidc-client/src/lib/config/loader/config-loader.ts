import { Provider } from '@angular/core';
import { forkJoin, Observable, of, switchMap } from 'rxjs';
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
  constructor(private configs$: Observable<OpenIdConfiguration[]>) {}

  loadConfigs(): Observable<OpenIdConfiguration>[] {
    // if (Array.isArray(this.configs$)) {
    //   return this.configs$;
    // }

    return this.configs$.pipe(
      switchMap((configs: OpenIdConfiguration[]) => {
        const asd = forkJoin(...configs) as Observable<OpenIdConfiguration>[];

        return asd;
      })
    );
  }
}
