
Setting up Azure B2C is not so clear. Azure B2C is not Azure AD. These are two separate products.

Every policy in Azure B2C is actual a separate Identity provider. So with multiple policies, you need multiple clients.

Also in Azure, each access token for an API needs to be requested separately. This can be solved also with multiple clients.

When using Azure B2C or Azure AD, it is not possible to fully logout. This is because the revocation endpoint is not supported. Introspection is also not supported. This means that refresh tokens and access tokens remain valid until the tokens expire. Due to this and the fact that the tokens are stored somewhere in the browser, you should keep the lifespan of the tokens short. Maybe 15 mins for access tokens and refresh tokens as short as possible. This problem can only be solved if the tokens can be invalidated when the user logs out. All other workarounds do not help. You could avoid this problem be using an identity provider which supports revocation or by using a server rendered OpenID Connect flow.


Links to setup Azure B2C

https://adamstorr.azurewebsites.net/blog/subscription-is-not-registered-to-use-namespace-Microsoft.AzureActiveDirectory

https://docs.microsoft.com/en-us/azure/active-directory-b2c/user-flow-overview

