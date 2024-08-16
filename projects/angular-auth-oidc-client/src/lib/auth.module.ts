import { CommonModule } from '@angular/common';
import {
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';
import { ModuleWithProviders, NgModule } from '@angular/core';
import { PassedInitialConfig } from './auth-config';
import { _provideAuth } from './provide-auth';

@NgModule({
  declarations: [],
  exports: [],
  imports: [CommonModule],
  providers: [provideHttpClient(withInterceptorsFromDi())],
})
export class AuthModule {
  static forRoot(
    passedConfig: PassedInitialConfig
  ): ModuleWithProviders<AuthModule> {
    return {
      ngModule: AuthModule,
      providers: [..._provideAuth(passedConfig)],
    };
  }
}
