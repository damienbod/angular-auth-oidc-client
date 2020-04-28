
## X-Frame-Options / CSP ancestor / different domains

If deploying the client application and the STS server application with 2 different domains,
the X-Frame-Options HTTPS header needs to allow all iframes. Then use the CSP HTTPS header to only allow the required domains.
**The silent renew requires this.**

Add this header to responses from the server that serves your SPA:

```
Content-Security-Policy: script-src 'self' 'unsafe-inline';style-src 'self' 'unsafe-inline';img-src 'self' data:;font-src 'self';frame-ancestors 'self' https://localhost:44318;block-all-mixed-content
```

where `https://localhost:44318` is the address of your STS server.

e.g. if you use NginX to serve your Angular application, it would be

```
http {
  server {
    ...
    add_header Content-Security-Policy "script-src 'self' 'unsafe-inline';style-src 'self' 'unsafe-inline';img-src 'self' data:;font-src 'self';frame-ancestors 'self' https://localhost:44318;block-all-mixed-content";
```

## Authorizing in a popup or iframe

You can call the Provider's authorization endpoint in a popup or iframe instead of navigating to it in the app's parent window.
This allows you to have the Provider's consent prompt display in a popup window to avoid unloading and reloading the app,
or to authorize the user silently by loading the endpoint in a hidden iframe if that supported by the Provider.

To get the fully-formed authorization URL, pass a handler function to `OidcSecurityService.authorize`
(this will also prevent the default behavior of loading the authorization endpoint in the current window):

```typescript
login() {
    this.oidcSecurityService.authorize((authUrl) => {
        // handle the authorrization URL
        window.open(authUrl, '_blank', 'toolbar=0,location=0,menubar=0');
    });
}
```
