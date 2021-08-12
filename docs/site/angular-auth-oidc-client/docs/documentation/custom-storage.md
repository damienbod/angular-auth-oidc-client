---
sidebar_label: Custom Storage
sidebar_position: 7
---

# Custom Storage

The lib uses the `sessionStorage` as default. If you need, you can create a custom storage (for example to use cookies).

Implement `AbstractSecurityStorage` and the `read`, `write` and `remove` methods:

```ts
import { AbstractSecurityStorage } from 'angular-auth-oidc-client';

@Injectable()
export class CustomStorage implements AbstractSecurityStorage {
  read(key: string) {
    localStorage.getItem(key);
  }
  write(key: string, value: any): void {
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

Then provide the class in the module:

```ts
@NgModule({
    imports: [
        ...
        AuthModule.forRoot({ config: { storage: new CustomStorage() } })
    ],
    ...
})
```
