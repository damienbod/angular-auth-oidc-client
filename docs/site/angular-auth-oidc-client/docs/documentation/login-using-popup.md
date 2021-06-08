---
sidebar_label: Login using a popup
sidebar_position: 4
---

# Login using a Popup

You can authenticate with any Open ID Connect identity provider using a popup.

This allows you to have the provider's consent prompt display in a popup window to avoid unloading and reloading the app.

## Sample

```typescript
  userData$: Observable<any>;

  isAuthenticated: boolean;

  constructor(public oidcSecurityService: OidcSecurityService) {}

  ngOnInit() {
    this.oidcSecurityService.checkAuth().subscribe(({ isAuthenticated, userData, accessToken, errorMessage }) => {
      console.log(isAuthenticated);
      console.log(userData);
      console.log(accessToken);
      console.log(errorMessage);
    });
  }

  loginWithPopup() {
    this.oidcSecurityService.authorizeWithPopUp().subscribe(({ isAuthenticated, userData, accessToken, errorMessage }) => {
      console.log(isAuthenticated);
      console.log(userData);
      console.log(accessToken);
      console.log(errorMessage);
    });
  }
```

## PopupOptions

You can pass options to control the dimension of the popup with the `PopupOptions` interface as a second parameter

```typescript

loginWithPopup() {
  const somePopupOptions = { width: 500, height: 500, left: 50, top: 50 };

  this.oidcSecurityService.authorizeWithPopUp(null, somePopupOptions)
    .subscribe(({ isAuthenticated, userData, accessToken, errorMessage }) => {
    /* ... */
    });
}

```

## Sample Application

[app.component.ts](../projects/sample-code-flow-popup/src/app/app.component.ts)
