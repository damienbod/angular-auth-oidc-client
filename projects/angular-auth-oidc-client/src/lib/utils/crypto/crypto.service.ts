import { DOCUMENT, inject, Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class CryptoService {
  private readonly document = inject<Document>(DOCUMENT);

  getCrypto(): any {
    // support for IE,  (window.crypto || window.msCrypto)
    return (
      this.document.defaultView?.crypto ||
      (this.document.defaultView as any)?.msCrypto
    );
  }
}
