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

Then provide the class in the module:

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
