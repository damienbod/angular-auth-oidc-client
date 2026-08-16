   export class OidcError extends Error {
     error: string;

     errorDescription?: string;

     errorUri?: string;

     constructor(error: string, errorDescription?: string, errorUri?: string) {
       super(errorDescription || error); // Pass the error description or error to the base Error class
       this.name = 'OidcError';
       this.error = error;
       this.errorDescription = errorDescription;
       this.errorUri = errorUri;

       // Set the prototype explicitly to retain the instance type in JavaScript
       Object.setPrototypeOf(this, OidcError.prototype);
     }
   }
