# Public Events

# Redirect after loing (if implement)

## Custom Storage

If you need, you can create a custom storage (for example to use cookies).

Implement `OidcSecurityStorage` class-interface and the `read` and `write` methods:

```typescript
@Injectable()
export class CustomStorage implements OidcSecurityStorage {

    public read(key: string): any {
        ...
        return ...
    }

    public write(key: string, value: any): void {
        ...
    }

}
```

Then provide the class in the module:

```typescript
@NgModule({
    imports: [
        ...
        AuthModule.forRoot({ storage: CustomStorage })
    ],
    ...
})
```

## Adding custom parameters to the authorization request

Custom parameters can be added to the auth request by using the setCustomRequestParameters method. Here you could add ui_locale, acr or whatever you request for your token server.

```typescript
this.oidcSecurityService.setCustomRequestParameters({ ui_locales: culture });
```
