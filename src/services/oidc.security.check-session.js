var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable, EventEmitter, Output } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import 'rxjs/add/observable/throw';
import 'rxjs/add/observable/interval';
import 'rxjs/add/observable/timer';
import { AuthConfiguration } from '../auth.configuration';
import { OidcSecurityCommon } from './oidc.security.common';
import { AuthWellKnownEndpoints } from './auth.well-known-endpoints';
var OidcSecurityCheckSession = (function () {
    function OidcSecurityCheckSession(authConfiguration, oidcSecurityCommon, authWellKnownEndpoints) {
        this.authConfiguration = authConfiguration;
        this.oidcSecurityCommon = oidcSecurityCommon;
        this.authWellKnownEndpoints = authWellKnownEndpoints;
        this.onCheckSessionChanged = new EventEmitter(true);
    }
    OidcSecurityCheckSession.prototype.init = function () {
        var _this = this;
        this.sessionIframe = window.document.createElement('iframe');
        this.oidcSecurityCommon.logDebug(this.sessionIframe);
        this.sessionIframe.style.display = 'none';
        this.sessionIframe.src = this.authWellKnownEndpoints.check_session_iframe;
        window.document.body.appendChild(this.sessionIframe);
        this.iframeMessageEvent = this.messageHandler.bind(this);
        window.addEventListener('message', this.iframeMessageEvent, false);
        return Observable.create(function (observer) {
            _this.sessionIframe.onload = function () {
                observer.next(_this);
                observer.complete();
            };
        });
    };
    OidcSecurityCheckSession.prototype.pollServerSession = function (session_state, clientId) {
        var _this = this;
        var source = Observable.timer(3000, 3000)
            .timeInterval()
            .pluck('interval')
            .take(10000);
        var subscription = source.subscribe(function () {
            _this.oidcSecurityCommon.logDebug(_this.sessionIframe);
            _this.sessionIframe.contentWindow.postMessage(clientId + ' ' + session_state, _this.authConfiguration.stsServer);
        }, function (err) {
            _this.oidcSecurityCommon.logError('pollServerSession error: ' + err);
        }, function () {
            _this.oidcSecurityCommon.logDebug('checksession pollServerSession completed');
        });
    };
    OidcSecurityCheckSession.prototype.messageHandler = function (e) {
        if (e.origin === this.authConfiguration.stsServer &&
            e.source === this.sessionIframe.contentWindow) {
            if (e.data === 'error') {
                this.oidcSecurityCommon.logWarning('error from checksession messageHandler');
            }
            else if (e.data === 'changed') {
                this.onCheckSessionChanged.emit();
            }
            else {
                this.oidcSecurityCommon.logDebug(e.data + ' from checksession messageHandler');
            }
        }
    };
    return OidcSecurityCheckSession;
}());
__decorate([
    Output(),
    __metadata("design:type", EventEmitter)
], OidcSecurityCheckSession.prototype, "onCheckSessionChanged", void 0);
OidcSecurityCheckSession = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [AuthConfiguration,
        OidcSecurityCommon,
        AuthWellKnownEndpoints])
], OidcSecurityCheckSession);
export { OidcSecurityCheckSession };
//# sourceMappingURL=oidc.security.check-session.js.map