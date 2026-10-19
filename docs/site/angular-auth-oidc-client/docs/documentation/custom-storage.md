---
sidebar_label: Custom Storage
sidebar_position: 7
---

# Custom Storage

The library uses the `sessionStorage` as the default storage mechanism (`DefaultSessionStorageService`). The library also ships a `DefaultLocalStorageService`. To use `localStorage`, you do not need a custom class:

```ts
import { AbstractSecurityStorage, DefaultLocalStorageService } from 'angular-auth-oidc-client';

// ...
{ provide: AbstractSecurityStorage, useClass: DefaultLocalStorageService },
```

If needed, you can create a custom storage implementation, e.g. to use cookies.
A storage provider is implemented as a class with the `AbstractSecurityStorage` class-interface and the `read`, `write`, `remove` and `clear` methods.
The following example shows a custom storage that uses `localStorage`:

```ts
import { AbstractSecurityStorage } from 'angular-auth-oidc-client';

@Injectable()
export class MyStorageService implements AbstractSecurityStorage {
  read(key: string): string | null {
    return localStorage.getItem(key);
  }

  write(key: string, value: string): void {
    localStorage.setItem(key, value);
  }

  remove(key: string): void {
    localStorage.removeItem(key);
  }

  clear(): void {
    localStorage.clear();
  }
}
```

Then provide the custom storage class in the `ApplicationConfig`:

```ts
export const appConfig: ApplicationConfig = {
  providers: [
    provideAuth({
      // ..
    }),
    { provide: AbstractSecurityStorage, useClass: MyStorageService },
  ],
};
```

## NgModule

You can also provide the storage class in a module using the `providers` array:

```ts
@NgModule({
  imports: [
    AuthModule.forRoot({
      config: {
        // ...
      },
    }),
  ],
  providers: [{ provide: AbstractSecurityStorage, useClass: MyStorageService }],
  exports: [AuthModule],
})
export class AuthConfigModule {}
```
