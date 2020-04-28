# Using the access token

The access token can be used by calling the `getToken()` function.

## Accessing the access token

You can get the access token by calling the method `getToken()` on the `OidcSecurityService`

```typescript
const token = this.oidcSecurityService.getToken();
```

And then you can use it in the HttpHeaders

```typescript
import { HttpHeaders } from '@angular/common/http';
const token = this.oidcSecurityServices.getToken();
const httpOptions = {
  headers: new HttpHeaders({
    'Authorization': 'Bearer ' + token
  })
};
```

## Http Interceptor

The HttpClient allows you to write [interceptors](https://angular.io/guide/http#intercepting-all-requests-or-responses). A common usecase would be to intercept any outgoing HTTP request and add an authorization header.

**Note** Do not send the access token with requests for which the access token is not intended!

```typescript
@Injectable()
export class AuthInterceptor implements HttpInterceptor {
    constructor(private oidcSecurityService: OidcSecurityService) {}

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        const token = this.oidcSecurityService.getToken();

        if (token) {
            request = request.clone({
                headers: request.headers.set('Authorization', 'Bearer ' + token),
            });
        }
        return next.handle(request);
    }
}
```

## Revoke the access token

Access tokens can be revoked using the `revokeAccessToken()` function. If you provide the access token in the param, any access token from the same STS can be revoked, if the STS supports the revocation endpoint.

```typescript
revokeAccessToken() {
    this.oidcSecurityService.revokeAccessToken()
		  .subscribe((result) => console.log(result));
}
```
