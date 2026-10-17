---
sidebar_label: Deploying to different domains
sidebar_position: 4
---

# Deploying to different domains

If the client and the Secure Token Service provider are hosted on 2 different domains, the silent renew (iframe) and the check session features load pages from the Secure Token Service inside an iframe in your SPA.
**The silent renew requires this.**

The Secure Token Service must therefore allow your SPA to frame its pages. Use the CSP `frame-ancestors` directive on the responses of the Secure Token Service (authorize endpoint and check session iframe) and make sure they are not blocked by an `X-Frame-Options: DENY` or `SAMEORIGIN` header:

```bash
Content-Security-Policy: frame-ancestors 'self' https://localhost:4200
```

where `https://localhost:4200` is the address of your SPA. How to set this header depends on your Secure Token Service.

The silent renew iframe is redirected back to the `silentRenewUrl` of your SPA, so the server that serves your SPA must allow its own pages to be framed:

```bash
Content-Security-Policy: script-src 'self' 'unsafe-inline';style-src 'self' 'unsafe-inline';img-src 'self' data:;font-src 'self';frame-ancestors 'self'
```

E.g. if you use nginx to serve your Angular application, you can configure the server as follows:

```javascript
http {
  server {
    ...
    add_header Content-Security-Policy "script-src 'self' 'unsafe-inline';style-src 'self' 'unsafe-inline';img-src 'self' data:;font-src 'self';frame-ancestors 'self'";
```

If you use refresh tokens (`useRefreshToken: true`) instead of the iframe silent renew and do not use check session, no iframes are loaded and none of this is required.
