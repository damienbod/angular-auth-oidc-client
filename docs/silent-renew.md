# Silent Renew

- [Silent Renew Code Flow with PKCE](#silent-renew-code-flow-with-pkce)
- [Silent Renew Code Flow with PKCE with refresh tokens](#silent-renew-code-flow-with-pkce-with-refresh-tokens)
- [Silent Renew Implicit Flow](#silent-renew-implicit-flow)
- [Secure Token Server CSP and CORS](#secure-token-server-csp-and-cors)

When silent renew is enabled, a DOM event will be automatically installed in the application's host window.
The event `oidc-silent-renew-message` accepts a `CustomEvent` instance with the token returned from the OAuth server
in its `detail` field.
The event handler will send this token to the authorization callback and complete the validation.

Point the `silent_renew_url` property to an HTML file which contains the following script element to enable authorization.

The `renewTimeBeforeTokenExpiresInSeconds` property can be used to start the renew process n-seconds before the tokens expired.

Both the access token and the id_token are used to start this process.

## Silent Renew Code Flow with PKCE

```javascript
<script>
	window.onload = function () {
		/* The parent window hosts the Angular application */
		var parent = window.parent;
		/* Send the id_token information to the oidc message handler */
		var event = new CustomEvent('oidc-silent-renew-message', { detail: window.location });
		parent.dispatchEvent(event);
	};
</script>
```

## Silent Renew Code Flow with PKCE with refresh tokens

No iframes are used for this flow, the the renew only needs to be configured in the app module.

## Silent Renew Implicit Flow

```javascript
<script>
    window.onload = function () {
    /* The parent window hosts the Angular application */
    var parent = window.parent;
    /* Send the id_token information to the oidc message handler */
    var event = new CustomEvent('oidc-silent-renew-message', {detail: window.location.hash.substr(1) });
    parent.dispatchEvent(event);
};
</script>
```

## Secure Token Server CSP and CORS

When silent renew is enabled, the lib will attempt to perform a renew before returning the authorization state.
This allows the application to authorize a user, that is already authenticated, without redirects.

Silent renew requires CSP configuration on the server to allow iframes and also CORS
