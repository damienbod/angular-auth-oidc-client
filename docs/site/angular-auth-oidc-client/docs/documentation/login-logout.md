---
sidebar_label: Login & Logout
sidebar_position: 3
---

# Login & Logout

In this section the Login and Logout mechanisms should be briefly described.

## Login

## Logout

The `logoff()` function sends an end session request to the OIDC server, if it is available, or the check session has not sent a changed event.

```typescript
logout() {
   this.oidcSecurityService.logoff();
}
```

You can pass a `urlHandler` and custom parameters if you want.

Example:

```typescript
logout() {
   this.oidcSecurityService.logoff({ customParams : { foo:"bar", baz: "Henlo" }});
}
```

The `logoffAndRevokeTokens()` function revokes the access token and the refresh token if using a refresh flow, and then logoff like above.

```typescript
logoffAndRevokeTokens() {
   this.oidcSecurityService.logoffAndRevokeTokens()
      .subscribe((result) => console.log(result));
}
```

The `logoffLocal()` function is used to reset you local session in the browser, but not sending anything to the server.

```typescript
logoutLocal() {
   this.oidcSecurityService.logoffLocal();
}
```
