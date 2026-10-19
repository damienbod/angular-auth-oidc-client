---
sidebar_label: Custom Logger
sidebar_position: 6
---

# Custom Logger

By default the library logs to the console. To use your own logger, implement the `AbstractLoggerService` class-interface with the `logError`, `logWarning` and `logDebug` methods:

```ts
import { Injectable } from '@angular/core';
import { AbstractLoggerService } from 'angular-auth-oidc-client';

@Injectable()
export class MyLoggerService implements AbstractLoggerService {
  logError(message: string | object, ...args: any[]): void {
    // ...
  }

  logWarning(message: string | object, ...args: any[]): void {
    // ...
  }

  logDebug(message: string | object, ...args: any[]): void {
    // ...
  }
}
```

The library filters the messages by the configured `logLevel` (`LogLevel.None`, `LogLevel.Debug`, `LogLevel.Warn`, `LogLevel.Error`) before it calls your logger. Errors are always passed on unless the `logLevel` is `LogLevel.None`. Warnings and debug messages are only passed on when a `logLevel` is set that includes them. Each message is prefixed with `[ERROR]`, `[WARN]` or `[DEBUG]` and the `configId`, if there is one.

## Usage

### Standalone

Include the logger class within the `ApplicationConfig`:

```ts
export const appConfig: ApplicationConfig = {
  providers: [
    provideAuth({
      config: {
        // ...
      },
    }),
    { provide: AbstractLoggerService, useClass: MyLoggerService },
  ],
};
```

### NgModule

Provide the logger class in the module:

```ts
@NgModule({
  imports: [
    AuthModule.forRoot({
      config: {
        // ...
      },
    }),
  ],
  providers: [{ provide: AbstractLoggerService, useClass: MyLoggerService }],
  exports: [AuthModule],
})
export class AuthConfigModule {}
```
