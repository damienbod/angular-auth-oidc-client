# X-Frame-Options / CSP ancestor / different domains

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

Please see [Authorizing in a popup or iframe](authorizing-popup-iframe.md)
