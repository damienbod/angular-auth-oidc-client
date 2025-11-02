# Installing Development Certificates

> [!IMPORTANT]
> The certificate in this folder is for illustrative purposes only. Please use your own certificate.

1. Double-click the `pfx` on a Windows machine and use the password `1234` to install.
1. Add the certificates to the Angular CLI project, for example in the **/certs** folder.
1. Update the `ui\angular.json` file to point to the certificate files:

   ```json
   "sslKey": "certs/dev_localhost.key",
   "sslCert": "certs/dev_localhost.pem",
   "port": 4201
   ```
