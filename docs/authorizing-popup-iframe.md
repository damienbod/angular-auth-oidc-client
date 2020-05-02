# Authorizing in a popup or iframe

You can call the Provider's authorization endpoint in a popup or iframe instead of navigating to it in the app's parent window.
This allows you to have the Provider's consent prompt display in a popup window to avoid unloading and reloading the app,
or to authorize the user silently by loading the endpoint in a hidden iframe if that supported by the Provider.

To get the fully-formed authorization URL, pass a handler function to `OidcSecurityService.authorize`
(this will also prevent the default behavior of loading the authorization endpoint in the current window):

```typescript
login() {

    const urlHandler = (authUrl) => {
        // handle the authorization URL
        window.open(authUrl, '_blank', 'toolbar=0,location=0,menubar=0');
    }

    this.oidcSecurityService.authorize({ urlhandler });
}
```
