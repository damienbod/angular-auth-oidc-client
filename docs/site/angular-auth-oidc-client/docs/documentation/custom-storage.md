---
sidebar_label: Custom Storage
sidebar_position: 7
---

# Custom Storage

The lib uses the `sessionStorage` as default. If needed, you can create a custom storage implementation, e.g. to use `localStorage` or cookies.
A storage is implemented as a class with the `AbstractSecurityStorage` interface and the `read`, `write` and `remove` methods.
The following example shows a custom storage that uses `localStorage`:

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
      // ...
      AuthModule.forRoot({ config: { storage: new CustomStorage() } })
  ],
  // ...
})
```
