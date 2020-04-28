# using the access token



## Using the access_token

In the http services, add the token to the header using the oidcSecurityService

```typescript
private setHeaders() {
	this.headers = new HttpHeaders();
	this.headers = this.headers.set('Content-Type', 'application/json');
	this.headers = this.headers.set('Accept', 'application/json');

	const token = this._securityService.getToken();
	if (token !== '') {
		const tokenValue = 'Bearer ' + token;
		this.headers = this.headers.set('Authorization', tokenValue);
	}
}
```

## Http Interceptor

The HttpClient allows you to write [interceptors](https://angular.io/guide/http#intercepting-all-requests-or-responses). A common usecase would be to intercept any outgoing HTTP request and add an authorization header.

```ts
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

## Revoke the access_token