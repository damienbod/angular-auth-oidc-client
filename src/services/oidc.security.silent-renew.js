var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable } from '@angular/core';
import { OidcSecurityCommon } from './oidc.security.common';
import { Observable } from 'rxjs/Observable';
var OidcSecuritySilentRenew = (function () {
    function OidcSecuritySilentRenew(oidcSecurityCommon) {
        this.oidcSecurityCommon = oidcSecurityCommon;
    }
    OidcSecuritySilentRenew.prototype.initRenew = function () {
        this.sessionIframe = window.document.createElement('iframe');
        this.oidcSecurityCommon.logDebug(this.sessionIframe);
        this.sessionIframe.style.display = 'none';
        window.document.body.appendChild(this.sessionIframe);
    };
    OidcSecuritySilentRenew.prototype.startRenew = function (url) {
        var _this = this;
        this.oidcSecurityCommon.logDebug('startRenew for URL:' + url);
        this.sessionIframe.src = url;
        return Observable.create(function (observer) {
            _this.sessionIframe.onload = function () {
                observer.next(_this);
                observer.complete();
            };
        });
    };
    return OidcSecuritySilentRenew;
}());
OidcSecuritySilentRenew = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [OidcSecurityCommon])
], OidcSecuritySilentRenew);
export { OidcSecuritySilentRenew };
//# sourceMappingURL=oidc.security.silent-renew.js.map