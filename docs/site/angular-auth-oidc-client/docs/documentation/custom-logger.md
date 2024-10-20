---
sidebar_label: Custom Logger
sidebar_position: 6
---

# Custom Logger

```ts
import { AbstractLoggerService } from 'angular-auth-oidc-client';

@Injectable()
export class MyLoggerService implements AbstractLoggerService {
  // ...
}
```

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
